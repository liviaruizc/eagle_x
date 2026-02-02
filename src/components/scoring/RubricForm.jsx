import { questionsRubric, sectionLabels } from "../../domain/rubric/questionsRubric";

function groupBySection(questions) {
    return questions.reduce((acc, q) => {
        acc[q.section] = acc[q.section] || [];
        acc[q.section].push(q);
        return acc;
    }, {});
}

export default function RubricForm({ answers, onChange }) {
    const grouped = groupBySection(questionsRubric);

    return (
        <div className="space-y-6">
            {Object.entries(grouped).map(([sectionKey, questions]) => (
                <div key={sectionKey} className="rounded-2xl border bg-white p-5 shadow-sm">
                    <h2 className="text-lg font-semibold">{sectionLabels[sectionKey]}</h2>

                    <div className="mt-4 space-y-4">
                        {questions.map((q) => (
                            <div key={q.id} className="flex flex-col gap-2">
                                <p className="text-sm font-medium">{q.title}</p>

                                <div className="flex items-center gap-4">
                                    {[1, 2, 3, 4, 5].map((n) => (
                                        <label key={n} className="flex items-center gap-2 text-sm">
                                            <input
                                                type="radio"
                                                name={q.id}
                                                value={n}
                                                checked={answers[q.id] === n}
                                                onChange={() => onChange(q.id, n)}
                                                className="h-4 w-4"
                                            />
                                            {n}
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
