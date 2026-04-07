import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../components/ui/Button.jsx";
import { Card, CardBody, CardTitle } from "../components/ui/Card.jsx";
import { fetchJudgeEventInstances } from "../services/judgeSignup/judgeSignupApi.js";
import {
    fetchJudgeProfile,
    updateJudgeProfileFacets,
} from "../services/judgeSignup/judgeSignupService.js";
import {
    getCollegeFacetId,
    getProgramOptionsForFacet as getFacetProgramOptions,
    hasFacetValue,
    normalizeSelectedOptionIds,
    removeSecondSelectionFromFacet,
    updatePrimarySelection,
    updateSecondarySelection,
    updateSingleFacetSelection,
    isCollegeFacet,
    isMultiProgramFacet,
} from "./judgeSignup/judgeSignupPageUtils.js";

export default function JudgeProfilePage() {
    const navigate = useNavigate();
    const personId = sessionStorage.getItem("auth_person_id");

    const [events, setEvents] = useState([]);
    const [selectedEventId, setSelectedEventId] = useState(
        sessionStorage.getItem("judge_event_instance_id") ?? ""
    );

    const [facets, setFacets] = useState([]);
    const [personEventRoleId, setPersonEventRoleId] = useState(null);
    const [selectedFacetOptionByFacetId, setSelectedFacetOptionByFacetId] = useState({});
    const [showSecondSelectionByFacetId, setShowSecondSelectionByFacetId] = useState({});

    const [isLoadingEvents, setIsLoadingEvents] = useState(true);
    const [isLoadingProfile, setIsLoadingProfile] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const collegeFacetId = useMemo(() => getCollegeFacetId(facets), [facets]);
    const requiredFacetIds = useMemo(
        () => facets.filter((f) => f.isRequired).map((f) => f.facetId),
        [facets]
    );

    // Load the judge's events once
    useEffect(() => {
        async function loadEvents() {
            if (!personId) {
                setError("No active session. Please log in first.");
                setIsLoadingEvents(false);
                return;
            }

            try {
                const judgeEvents = await fetchJudgeEventInstances(personId);
                const uniqueEvents = judgeEvents.filter(
                    (event, index, self) =>
                        self.findIndex((e) => e.event_instance_id === event.event_instance_id) === index
                );
                setEvents(uniqueEvents);

                if (!selectedEventId && judgeEvents.length) {
                    setSelectedEventId(String(judgeEvents[0].event_instance_id));
                }
            } catch (err) {
                console.error(err);
                setError("Could not load your events.");
            } finally {
                setIsLoadingEvents(false);
            }
        }

        loadEvents();
    }, [personId]);

    // Reload profile whenever the selected event changes
    useEffect(() => {
        if (!selectedEventId || !personId) return;

        async function loadProfile() {
            setIsLoadingProfile(true);
            setError("");
            setMessage("");
            setFacets([]);
            setSelectedFacetOptionByFacetId({});
            setShowSecondSelectionByFacetId({});

            try {
                const profile = await fetchJudgeProfile(personId, selectedEventId);
                setFacets(profile.facets);
                setPersonEventRoleId(profile.personEventRoleId);
                setSelectedFacetOptionByFacetId(profile.selectedFacetOptionByFacetId);
            } catch (err) {
                console.error(err);
                setError("Could not load profile for this event.");
            } finally {
                setIsLoadingProfile(false);
            }
        }

        loadProfile();
    }, [personId, selectedEventId]);

    function handleFacetChange(facetId, optionId) {
        setSelectedFacetOptionByFacetId((prev) =>
            updateSingleFacetSelection({ previousSelections: prev, facetId, optionId, collegeFacetId, facets })
        );
    }

    function handleMultiFacetPrimaryChange(facetId, optionId) {
        setSelectedFacetOptionByFacetId((prev) =>
            updatePrimarySelection({ previousSelections: prev, facetId, optionId, collegeFacetId, facets })
        );
    }

    function handleMultiFacetSecondaryChange(facetId, optionId) {
        setSelectedFacetOptionByFacetId((prev) =>
            updateSecondarySelection({ previousSelections: prev, facetId, optionId, collegeFacetId, facets })
        );
    }

    function handleAddSecondSelection(facetId) {
        setShowSecondSelectionByFacetId((prev) => ({ ...prev, [facetId]: true }));
    }

    function handleRemoveSecondSelection(facetId) {
        setShowSecondSelectionByFacetId((prev) => ({ ...prev, [facetId]: false }));
        setSelectedFacetOptionByFacetId((prev) =>
            removeSecondSelectionFromFacet({ previousSelections: prev, facetId, collegeFacetId, facets })
        );
    }

    function resolveProgramOptionsForFacet(facet) {
        return getFacetProgramOptions({ facet, collegeFacetId, selectedFacetOptionByFacetId });
    }

    async function handleSave(e) {
        e.preventDefault();
        setError("");
        setMessage("");

        const hasMissing = requiredFacetIds.some((facetId) => !hasFacetValue(selectedFacetOptionByFacetId, facetId));
        if (hasMissing) {
            setError("Please fill all required fields.");
            return;
        }

        if (!personEventRoleId) {
            setError("Could not find your event role. Please contact an admin.");
            return;
        }

        setIsSaving(true);
        try {
            await updateJudgeProfileFacets(personEventRoleId, selectedFacetOptionByFacetId);
            if (selectedEventId) {
                sessionStorage.setItem("judge_event_instance_id", String(selectedEventId));
            }
            Object.keys(sessionStorage)
                .filter((key) => key.startsWith("queue_filters_") || key.startsWith("queue_default_filters_"))
                .forEach((key) => sessionStorage.removeItem(key));
            setMessage("Profile updated. Your queue filters will reflect these changes on the next load.");
        } catch (err) {
            console.error(err);
            setError("Could not save profile.");
        } finally {
            setIsSaving(false);
        }
    }

    const isLoading = isLoadingEvents || isLoadingProfile;

    return (
        <div className="mx-auto max-w-2xl p-6">
            <div className="mb-6">
                <Button variant="outline" onClick={() => navigate("/judge")}>← Back</Button>
            </div>

            <Card>
                <CardTitle>My Profile</CardTitle>
                <CardBody>
                    <p className="mb-5 text-sm text-[#55616D]">
                        Update your judging preferences below. These determine your default queue filters
                        and which submissions you are matched to.
                    </p>

                    {/* Event selector */}
                    {!isLoadingEvents && events.length > 0 && (
                        <div className="mb-5">
                            <label className="block text-sm font-semibold text-[#004785] mb-1">
                                Event
                            </label>
                            <select
                                className="w-full rounded-lg border border-gray-300 p-2 text-sm text-[#55616D] focus:outline-none focus:ring-2 focus:ring-[#00794C]/50"
                                value={selectedEventId}
                                onChange={(e) => setSelectedEventId(e.target.value)}
                            >
                                {events.map((event) => (
                                    <option key={event.event_instance_id} value={event.event_instance_id}>
                                        {event.name || event.event_instance_id}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {isLoading && <p className="text-sm text-[#55616D] py-4">Loading profile...</p>}
                    {error && <p className="text-sm text-red-600 py-2">{error}</p>}
                    {message && <p className="text-sm text-[#00794C] py-2 font-medium">{message}</p>}

                    {!isLoading && !error && (
                        <form onSubmit={handleSave} className="space-y-4">
                            {!facets.length && (
                                <p className="text-sm text-[#55616D]">No profile fields configured for this event.</p>
                            )}

                            {facets.map((facet) => {
                                const isCollege = isCollegeFacet(facet, collegeFacetId);
                                const isMulti = isMultiProgramFacet(facet);
                                const programOptions = resolveProgramOptionsForFacet(facet);
                                const currentSelections = normalizeSelectedOptionIds(selectedFacetOptionByFacetId[facet.facetId]);
                                const showSecond = showSecondSelectionByFacetId[facet.facetId] ?? false;

                                return (
                                    <div key={facet.facetId} className="rounded-xl border border-gray-200 bg-[#F3F3F3] p-4">
                                        <p className="text-sm font-semibold text-[#004785] mb-2">
                                            {facet.name || facet.code}
                                            {facet.isRequired && <span className="ml-1 text-red-500">*</span>}
                                        </p>

                                        {isMulti ? (
                                            <div className="space-y-2">
                                                <select
                                                    className="w-full rounded-lg border border-gray-300 p-2 text-sm text-[#55616D] focus:outline-none focus:ring-2 focus:ring-[#00794C]/50"
                                                    value={currentSelections[0] ?? ""}
                                                    onChange={(e) => handleMultiFacetPrimaryChange(facet.facetId, e.target.value)}
                                                >
                                                    <option value="">Select...</option>
                                                    {(programOptions.length ? programOptions : facet.options).map((opt) => (
                                                        <option key={`${facet.facetId}-${opt.facet_option_id}`} value={opt.facet_option_id}>
                                                            {opt.label}
                                                        </option>
                                                    ))}
                                                </select>

                                                {showSecond && (
                                                    <div className="flex gap-2">
                                                        <select
                                                            className="flex-1 rounded-lg border border-gray-300 p-2 text-sm text-[#55616D] focus:outline-none focus:ring-2 focus:ring-[#00794C]/50"
                                                            value={currentSelections[1] ?? ""}
                                                            onChange={(e) => handleMultiFacetSecondaryChange(facet.facetId, e.target.value)}
                                                        >
                                                            <option value="">Select second...</option>
                                                            {(programOptions.length ? programOptions : facet.options).map((opt) => (
                                                                <option key={`${facet.facetId}-${opt.facet_option_id}`} value={opt.facet_option_id}>
                                                                    {opt.label}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <Button type="button" variant="outline" onClick={() => handleRemoveSecondSelection(facet.facetId)}>
                                                            Remove
                                                        </Button>
                                                    </div>
                                                )}

                                                {!showSecond && (
                                                    <Button type="button" variant="outline" onClick={() => handleAddSecondSelection(facet.facetId)}>
                                                        + Add second selection
                                                    </Button>
                                                )}
                                            </div>
                                        ) : (
                                            <select
                                                className="w-full rounded-lg border border-gray-300 p-2 text-sm text-[#55616D] focus:outline-none focus:ring-2 focus:ring-[#00794C]/50"
                                                value={currentSelections[0] ?? ""}
                                                onChange={(e) => handleFacetChange(facet.facetId, e.target.value)}
                                            >
                                                <option value="">Select...</option>
                                                {(isCollege ? facet.options : (programOptions.length ? programOptions : facet.options)).map((opt) => (
                                                    <option key={`${facet.facetId}-${opt.facet_option_id}`} value={opt.facet_option_id}>
                                                        {opt.label}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>
                                );
                            })}

                            {!!facets.length && (
                                <div className="flex justify-end pt-2">
                                    <Button type="submit" variant="primary" disabled={isSaving}>
                                        {isSaving ? "Saving..." : "Save Profile"}
                                    </Button>
                                </div>
                            )}
                        </form>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
