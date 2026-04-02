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
import { deleteSubmissionById, insertSubmission } from "./submissionApi.js";
import {
    buildImportedFacetValues,
    mergeFacetValues,
    normalizeSubmissionPayload,
} from "./submissionUtils.js";
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

// Creates one submission, author link, and facet values.
export async function createSubmissionForTrack(trackId, submission) {
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
    } catch (insertError) {
        await deleteSubmissionById(data.submission_id);
        throw insertError;
    }

    return data;
}

// Creates many submissions by reusing single-create flow.
export async function createSubmissionsForTrack(trackId, submissions) {
    if (!submissions.length) return { inserted: 0 };

    // Preload track facets once for import-column to facet-value mapping.
    const trackFacets = await fetchTrackFacets(trackId);

    for (const submission of submissions) {
        if (!submission.created_by_email) {
            throw new Error("Each imported row must include created_by_email.");
        }

        const importedFacetValues = buildImportedFacetValues(trackFacets, submission);
        const submissionWithFacetValues = {
            ...submission,
            facet_values: mergeFacetValues(submission.facet_values, importedFacetValues),
        };

        await createSubmissionForTrack(trackId, submissionWithFacetValues);
    }

    return { inserted: submissions.length };
}
