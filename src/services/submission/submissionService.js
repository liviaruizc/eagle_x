// Submission service facade for manual creation and Excel import flows.
//
// Responsibilities:
// - Expose stable page-facing functions for creating one or many submissions.
// - Orchestrate person resolution, role assignment, submission insert, and related joins.
//
// Notes:
// - DB access lives in `services/submission/submissionApi`.
// - Pure transforms live in `services/submission/submissionUtils`.

import { fetchTrackFacets } from "../track/trackService.js";
import {
    deleteSubmissionById,
    fetchTrackEventInstanceId,
    insertSubmission,
} from "./submissionApi.js";
import {
    buildImportedFacetValues,
    mergeFacetValues,
    normalizeSubmissionPayload,
} from "./submissionUtils.js";
import {
    createEventTable,
    fetchEventTableByNumber,
    upsertSubmissionTableAssignment,
} from "../tables/tablesApi.js";
import {
    createSubmissionRelations,
    ensureStudentRoleForPersonInEvent,
    findOrCreateOptionalPersonIdByEmail,
    findOrCreatePersonByEmail,
} from "./submissionWorkflow.js";

function parseDelimitedEmails(value) {
    if (!value) return [];

    const emails = String(value)
        .split(/[|,;\n]+/)
        .map((item) => item.trim().toLowerCase())
        .filter(Boolean);

    return [...new Set(emails)];
}

function parseSessionAssignment(value) {
    const normalized = String(value || "").trim().toUpperCase();
    if (!normalized) return null;

    const match = normalized.match(/^([A-Z])\s*[-_]?\s*(\d{1,4})$/);
    if (!match) {
        throw new Error(`Invalid session assignment "${value}". Expected format like A-200.`);
    }

    return {
        session: match[1],
        tableNumber: Number(match[2]),
    };
}

async function assignSubmissionTableFromSession({
    submissionId,
    eventInstanceId,
    trackId,
    sessionAssignment,
}) {
    const parsed = parseSessionAssignment(sessionAssignment);
    if (!parsed) return;

    let table = await fetchEventTableByNumber(
        eventInstanceId,
        trackId,
        parsed.tableNumber,
        parsed.session
    );

    if (!table) {
        table = await createEventTable(eventInstanceId, trackId, parsed.tableNumber, parsed.session);
    }

    await upsertSubmissionTableAssignment(submissionId, table.table_id);
}

// Creates one submission, author link, and facet values.
export async function createSubmissionForTrack(trackId, submission, options = {}) {
    const eventInstanceId = options.eventInstanceId ?? (await fetchTrackEventInstanceId(trackId));

    // Resolve primary author and ensure student role when author is newly created.
    const personResult = await findOrCreatePersonByEmail(submission.created_by_email);
    const personId = personResult.personId;

    if (personResult.wasCreated) {
        await ensureStudentRoleForPersonInEvent({
            trackId,
            personId,
        });
    }

    const primaryEmail = String(submission.created_by_email || "").trim().toLowerCase();
    const coAuthorEmails = parseDelimitedEmails(submission.co_author_emails).filter(
        (email) => email !== primaryEmail
    );
    const coAuthorPersonIds = [];

    for (const coAuthorEmail of coAuthorEmails) {
        const coAuthorResult = await findOrCreatePersonByEmail(coAuthorEmail);
        if (coAuthorResult.wasCreated) {
            await ensureStudentRoleForPersonInEvent({
                trackId,
                personId: coAuthorResult.personId,
            });
        }

        coAuthorPersonIds.push(coAuthorResult.personId);
    }

    // Resolve optional supervisor and insert base submission row.
    const supervisorPersonId = await findOrCreateOptionalPersonIdByEmail(submission.supervisor_email);
    const payload = normalizeSubmissionPayload(trackId, {
        ...submission,
        supervisor_person_id: supervisorPersonId,
    });

    const data = await insertSubmission(payload);

    // Insert relational rows; rollback submission row if downstream insert fails.
    try {
        await createSubmissionRelations({
            submissionId: data.submission_id,
            authorPersonIds: [personId, ...coAuthorPersonIds],
            facetValues: submission.facet_values ?? [],
        });

        if (submission.session_assignment) {
            if (!eventInstanceId) {
                throw new Error("Could not resolve event instance for table assignment.");
            }

            await assignSubmissionTableFromSession({
                submissionId: data.submission_id,
                eventInstanceId,
                trackId,
                sessionAssignment: submission.session_assignment,
            });
        }
    } catch (insertError) {
        await deleteSubmissionById(data.submission_id);
        throw insertError;
    }

    return data;
}

// Creates many submissions by reusing single-create flow.
export async function createSubmissionsForTrack(trackId, submissions) {
    if (!submissions.length) {
        return {
            inserted: 0,
            failed: 0,
            rowErrors: [],
        };
    }

    // Preload track facets once for import-column to facet-value mapping.
    const trackFacets = await fetchTrackFacets(trackId);
    const eventInstanceId = await fetchTrackEventInstanceId(trackId);
    let inserted = 0;
    let failed = 0;
    const rowErrors = [];

    for (let index = 0; index < submissions.length; index += 1) {
        const submission = submissions[index];
        const rowNumber = submission.rowNumber ?? index + 2;

        try {
            if (!submission.created_by_email) {
                throw new Error("created_by_email is required.");
            }

            const importedFacetValues = buildImportedFacetValues(trackFacets, submission);
            const submissionWithFacetValues = {
                ...submission,
                facet_values: mergeFacetValues(submission.facet_values, importedFacetValues),
            };

            await createSubmissionForTrack(trackId, submissionWithFacetValues, {
                eventInstanceId,
            });
            inserted += 1;
        } catch (error) {
            failed += 1;
            rowErrors.push({
                rowNumber,
                title: submission.title || "(no title)",
                email: submission.created_by_email || "(missing)",
                message: error.message || "Import failed for row.",
            });
        }
    }

    return {
        inserted,
        failed,
        rowErrors,
    };
}
