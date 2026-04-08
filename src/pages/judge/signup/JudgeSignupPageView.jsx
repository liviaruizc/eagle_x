import { Card, CardBody, CardTitle } from "../../components/ui/Card.jsx";
import Button from "../../components/ui/Button.jsx";
import {
    isCollegeFacet,
    isMultiProgramFacet,
} from "./judgeSignupPageUtils.js";

export default function JudgeSignupPageView({
    eventName,
    facets,
    selectedFacetOptionByFacetId,
    showSecondSelectionByFacetId,
    email,
    displayName,
    isLoading,
    isSubmitting,
    error,
    message,
    onEmailChange,
    onDisplayNameChange,
    onSubmit,
    onFacetChange,
    onMultiFacetPrimaryChange,
    onMultiFacetSecondaryChange,
    onAddSecondSelection,
    onRemoveSecondSelection,
    getProgramOptionsForFacet,
    onBack,
    onGoQueue,
}) {
    return (
        <div className="text-center text-bold text-5xl">
            Judge Signup
            <Card>
                <CardTitle>Register as Judge</CardTitle>
                <CardBody>
                    <div className="mb-4 flex justify-start gap-2">
                        <Button variant="outline" onClick={onBack}>Back to Events</Button>
                        <Button variant="primary" onClick={onGoQueue}>Go to Queue</Button>
                    </div>

                    <p className="mb-4 text-left text-sm text-gray-500">Event: {eventName}</p>

                    {isLoading && <p className="text-sm text-gray-500">Loading signup form...</p>}
                    {error && <p className="text-sm text-red-600">{error}</p>}
                    {message && <p className="text-sm text-gray-700">{message}</p>}

                    {!isLoading && (
                        <form onSubmit={onSubmit} className="space-y-3 text-left">
                            <label className="block text-sm text-gray-700">
                                Email
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(event) => onEmailChange(event.target.value)}
                                    className="mt-1 w-full rounded border p-2"
                                    required
                                />
                            </label>

                            <label className="block text-sm text-gray-700">
                                Display name
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(event) => onDisplayNameChange(event.target.value)}
                                    className="mt-1 w-full rounded border p-2"
                                    required
                                />
                            </label>

                            {!!facets.length && (
                                <div className="rounded border p-3">
                                    <p className="mb-2 text-sm font-medium">Judge Profile Fields</p>
                                    <div className="space-y-2">
                                        {facets.map((facet) => {
                                            const isCollege = isCollegeFacet(facet);
                                            const isMultiProgram = isMultiProgramFacet(facet);

                                            const selectedValues = Array.isArray(selectedFacetOptionByFacetId[facet.facetId])
                                                ? selectedFacetOptionByFacetId[facet.facetId]
                                                : [];
                                            const primaryValue = selectedValues[0] || "";
                                            const secondaryValue = selectedValues[1] || "";
                                            const showSecond = Boolean(
                                                showSecondSelectionByFacetId[facet.facetId] || selectedValues.length > 1
                                            );

                                            const options = isMultiProgram
                                                ? getProgramOptionsForFacet(facet)
                                                : facet.options ?? [];

                                            return (
                                                <div key={facet.facetId} className="block text-sm text-gray-700">
                                                    <label className="block">
                                                        {facet.name || facet.code}
                                                        {facet.isRequired ? " *" : ""}
                                                    </label>

                                                    {!isCollege && !isMultiProgram && (
                                                        <select
                                                            value={selectedFacetOptionByFacetId[facet.facetId] || ""}
                                                            onChange={(event) =>
                                                                onFacetChange(facet.facetId, event.target.value)
                                                            }
                                                            className="mt-1 w-full rounded border p-2"
                                                            required={facet.isRequired}
                                                        >
                                                            <option value="">Select an option</option>
                                                            {(facet.options ?? []).map((option) => (
                                                                <option key={option.facet_option_id} value={option.facet_option_id}>
                                                                    {option.label || option.value}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    )}

                                                    {isCollege && (
                                                        <div className="mt-2 rounded border p-2">
                                                            <select
                                                                value={primaryValue}
                                                                onChange={(event) =>
                                                                    onMultiFacetPrimaryChange(facet.facetId, event.target.value)
                                                                }
                                                                className="w-full rounded border p-2"
                                                                required={facet.isRequired}
                                                            >
                                                                <option value="">Select first college</option>
                                                                {options.map((option) => (
                                                                    <option key={option.facet_option_id} value={option.facet_option_id}>
                                                                        {option.label || option.value}
                                                                    </option>
                                                                ))}
                                                            </select>

                                                            {showSecond && (
                                                                <div className="mt-2">
                                                                    <select
                                                                        value={secondaryValue}
                                                                        onChange={(event) =>
                                                                            onMultiFacetSecondaryChange(
                                                                                facet.facetId,
                                                                                event.target.value
                                                                            )
                                                                        }
                                                                        className="w-full rounded border p-2"
                                                                    >
                                                                        <option value="">Select second college (optional)</option>
                                                                        {options
                                                                            .filter((option) => String(option.facet_option_id) !== String(primaryValue))
                                                                            .map((option) => (
                                                                                <option key={option.facet_option_id} value={option.facet_option_id}>
                                                                                    {option.label || option.value}
                                                                                </option>
                                                                            ))}
                                                                    </select>
                                                                    <div className="mt-2">
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            onClick={() => onRemoveSecondSelection(facet.facetId)}
                                                                        >
                                                                            Remove second college
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {!showSecond && (
                                                                <div className="mt-2">
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        onClick={() => onAddSecondSelection(facet.facetId)}
                                                                    >
                                                                        Add second college
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}

                                                    {!isCollege && isMultiProgram && (
                                                        <div className="mt-2 rounded border p-2">
                                                            <select
                                                                value={primaryValue}
                                                                onChange={(event) =>
                                                                    onMultiFacetPrimaryChange(facet.facetId, event.target.value)
                                                                }
                                                                className="w-full rounded border p-2"
                                                                required={facet.isRequired}
                                                                disabled={!options.length}
                                                            >
                                                                <option value="">
                                                                    {!options.length
                                                                        ? "Select college first"
                                                                        : "Select first option"}
                                                                </option>
                                                                {options.map((option) => (
                                                                    <option key={option.facet_option_id} value={option.facet_option_id}>
                                                                        {option.label || option.value}
                                                                    </option>
                                                                ))}
                                                            </select>

                                                            {showSecond && (
                                                                <div className="mt-2">
                                                                    <select
                                                                        value={secondaryValue}
                                                                        onChange={(event) =>
                                                                            onMultiFacetSecondaryChange(
                                                                                facet.facetId,
                                                                                event.target.value
                                                                            )
                                                                        }
                                                                        className="w-full rounded border p-2"
                                                                        disabled={!options.length}
                                                                    >
                                                                        <option value="">Select second option (optional)</option>
                                                                        {options
                                                                            .filter((option) => String(option.facet_option_id) !== String(primaryValue))
                                                                            .map((option) => (
                                                                                <option key={option.facet_option_id} value={option.facet_option_id}>
                                                                                    {option.label || option.value}
                                                                                </option>
                                                                            ))}
                                                                    </select>
                                                                    <div className="mt-2">
                                                                        <Button
                                                                            type="button"
                                                                            variant="outline"
                                                                            onClick={() => onRemoveSecondSelection(facet.facetId)}
                                                                        >
                                                                            Remove second option
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {!showSecond && (
                                                                <div className="mt-2">
                                                                    <Button
                                                                        type="button"
                                                                        variant="outline"
                                                                        onClick={() => onAddSecondSelection(facet.facetId)}
                                                                        disabled={!options.length}
                                                                    >
                                                                        Add second option
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-start">
                                <Button type="submit" variant="primary" disabled={isSubmitting}>
                                    {isSubmitting ? "Signing up..." : "Sign Up as Judge"}
                                </Button>
                            </div>
                        </form>
                    )}
                </CardBody>
            </Card>
        </div>
    );
}
