import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetchEventInstanceDetails } from "../../services/eventAdminService.js";
import { fetchJudgeSignupConfig, signUpJudgeForEvent } from "../../services/judgeSignup/judgeSignupService.js";
import { saveJudgeSession } from "../../services/judgeSession.js";
import JudgeSignupPageView from "./JudgeSignupPageView.jsx";
import {
    getCollegeFacetId,
    getProgramOptionsForFacet as getFacetProgramOptions,
    hasFacetValue,
    removeSecondSelectionFromFacet,
    updatePrimarySelection,
    updateSecondarySelection,
    updateSingleFacetSelection,
} from "./judgeSignupPageUtils.js";

export default function JudgeSignupPage() {
    const navigate = useNavigate();
    const { eventInstanceId } = useParams();

    const [eventName, setEventName] = useState("Event");
    const [facets, setFacets] = useState([]);
    const [selectedFacetOptionByFacetId, setSelectedFacetOptionByFacetId] = useState({});
    const [showSecondSelectionByFacetId, setShowSecondSelectionByFacetId] = useState({});

    const [email, setEmail] = useState("");
    const [displayName, setDisplayName] = useState("");

    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const requiredFacetIds = useMemo(
        () => facets.filter((facet) => facet.isRequired).map((facet) => facet.facetId),
        [facets]
    );

    const collegeFacetId = useMemo(() => getCollegeFacetId(facets), [facets]);

    useEffect(() => {
        async function loadSignupData() {
            setError("");
            setIsLoading(true);

            try {
                const [eventDetails, signupConfig] = await Promise.all([
                    fetchEventInstanceDetails(eventInstanceId),
                    fetchJudgeSignupConfig(),
                ]);

                setEventName(eventDetails.name);
                setFacets(signupConfig.facets);
            } catch (loadError) {
                console.error(loadError);
                setError("Could not load judge signup form.");
            } finally {
                setIsLoading(false);
            }
        }

        loadSignupData();
    }, [eventInstanceId]);

    function handleFacetChange(facetId, optionId) {
        setSelectedFacetOptionByFacetId((prev) =>
            updateSingleFacetSelection({
                previousSelections: prev,
                facetId,
                optionId,
                collegeFacetId,
                facets,
            })
        );
    }

    function handleMultiFacetPrimaryChange(facetId, optionId) {
        setSelectedFacetOptionByFacetId((prev) =>
            updatePrimarySelection({
                previousSelections: prev,
                facetId,
                optionId,
                collegeFacetId,
                facets,
            })
        );
    }

    function handleMultiFacetSecondaryChange(facetId, optionId) {
        setSelectedFacetOptionByFacetId((prev) =>
            updateSecondarySelection({
                previousSelections: prev,
                facetId,
                optionId,
                collegeFacetId,
                facets,
            })
        );
    }

    function handleAddSecondSelection(facetId) {
        setShowSecondSelectionByFacetId((prev) => ({
            ...prev,
            [facetId]: true,
        }));
    }

    function handleRemoveSecondSelection(facetId) {
        setShowSecondSelectionByFacetId((prev) => ({
            ...prev,
            [facetId]: false,
        }));

        setSelectedFacetOptionByFacetId((prev) =>
            removeSecondSelectionFromFacet({
                previousSelections: prev,
                facetId,
                collegeFacetId,
                facets,
            })
        );
    }

    function resolveProgramOptionsForFacet(facet) {
        return getFacetProgramOptions({
            facet,
            collegeFacetId,
            selectedFacetOptionByFacetId,
        });
    }

    async function handleSubmit(event) {
        event.preventDefault();
        setError("");
        setMessage("");

        if (!email.trim()) {
            setError("Email is required.");
            return;
        }

        if (!displayName.trim()) {
            setError("Display name is required.");
            return;
        }

        const hasMissingRequiredFacet = requiredFacetIds.some((facetId) =>
            !hasFacetValue(selectedFacetOptionByFacetId, facetId)
        );

        if (hasMissingRequiredFacet) {
            setError("Please fill all required judge profile fields.");
            return;
        }

        setIsSubmitting(true);

        try {
            const result = await signUpJudgeForEvent({
                eventInstanceId,
                email,
                displayName,
                selectedFacetOptionByFacetId,
            });

            saveJudgeSession({
                personId: result.personId,
                eventInstanceId,
                email: email.trim(),
                displayName: displayName.trim(),
            });

            setMessage("Signup complete. You can now start judging.");
        } catch (submitError) {
            console.error(submitError);
            setError("Could not complete signup. Check role/facet configuration.");
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <JudgeSignupPageView
            eventName={eventName}
            facets={facets}
            selectedFacetOptionByFacetId={selectedFacetOptionByFacetId}
            showSecondSelectionByFacetId={showSecondSelectionByFacetId}
            email={email}
            displayName={displayName}
            isLoading={isLoading}
            isSubmitting={isSubmitting}
            error={error}
            message={message}
            onEmailChange={setEmail}
            onDisplayNameChange={setDisplayName}
            onSubmit={handleSubmit}
            onFacetChange={handleFacetChange}
            onMultiFacetPrimaryChange={handleMultiFacetPrimaryChange}
            onMultiFacetSecondaryChange={handleMultiFacetSecondaryChange}
            onAddSecondSelection={handleAddSecondSelection}
            onRemoveSecondSelection={handleRemoveSecondSelection}
            getProgramOptionsForFacet={resolveProgramOptionsForFacet}
            onBack={() => navigate("/judges")}
            onGoQueue={() => navigate("/queue")}
        />
    );
}
