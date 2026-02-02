export const sectionLabels = {
    abstract: "Abstract / Introduction",
    methodology: "Methodology / Approach",
    results: "Results / Conclusion / Discussion",
    presentation: "Presentation / Organization",
    significance: "Significance / Importance",
    understanding: "Understanding & Professionalism",
};

export const questionsRubric = [
    // Abstract / Introduction
    { id: "abstract_research_question", section: "abstract", title: "Research question is well-formulated.", weight: 1 },
    { id: "abstract_objectives", section: "abstract", title: "Objectives are clearly stated.", weight: 1 },
    { id: "abstract_summary", section: "abstract", title: "Study is summarized well.", weight: 1 },

    // Methodology / Approach
    { id: "method_methods", section: "methodology", title: "Methods are appropriate and properly applied.", weight: 1 },
    { id: "method_original", section: "methodology", title: "Study is original work by presenter.", weight: 1 },

    // Results / Conclusion / Discussion
    { id: "results_strengths_limits", section: "results", title: "Strengths and limitations are presented.", weight: 1 },
    { id: "results_significance", section: "results", title: "Significance and implications emphasized.", weight: 1 },
    { id: "results_goals_addressed", section: "results", title: "Goals/questions addressed.", weight: 1 },

    // Presentation / Organization
    { id: "presentation_design", section: "presentation", title: "Poster design is clean and clear.", weight: 1 },
    { id: "presentation_organized", section: "presentation", title: "Well organized.", weight: 1 },
    { id: "presentation_summary", section: "presentation", title: "Effectively summarized.", weight: 1 },

    // Significance / Importance
    { id: "significance_contribution", section: "significance", title: "Contribution to field.", weight: 1 },
    { id: "significance_novel", section: "significance", title: "Novel / new approach.", weight: 1 },

    // Understanding & Professionalism
    { id: "understanding_subject", section: "understanding", title: "Understands subject and related areas.", weight: 1 },
    { id: "understanding_responses", section: "understanding", title: "Effective responses to questions.", weight: 1 },
];