const STORAGE_KEY = "budget-saas-v1";
const DEFAULT_PROJECT_ID = "app-v2";

const defaultProjects = [
  { id: "app-v2", label: "Application V2", eyebrow: "Projet Hyperfluid App V2", archived: false },
  { id: "app-v3", label: "Application V3", eyebrow: "Projet Hyperfluid App V3", archived: false },
  { id: "site-hyperfluid", label: "Site internet Hyperfluid", eyebrow: "Projet Site internet Hyperfluid", archived: false },
  { id: "marketing-communication", label: "Marketing et communication", eyebrow: "Projet Marketing et communication", archived: false },
  { id: "frais-commerce", label: "Frais de commerce", eyebrow: "Projet Frais de commerce", archived: false },
];

const categories = [
  { id: "equipe", label: "Équipe", color: "#2563eb" },
  { id: "cloud", label: "Infrastructure cloud", color: "#0f766e" },
  { id: "outils", label: "Outils SaaS internes", color: "#7c3aed" },
  { id: "marketing", label: "Marketing", color: "#f97316" },
  { id: "sales", label: "Sales", color: "#db2777" },
  { id: "support", label: "Support client", color: "#16a34a" },
  { id: "admin", label: "Juridique et compta", color: "#64748b" },
  { id: "paiements", label: "Frais bancaires et paiement", color: "#ca8a04" },
  { id: "divers", label: "Divers", color: "#dc2626" },
];

const defaultLineTemplates = [
  { id: "equipe-ux-ui", categoryId: "equipe", label: "UX/UI" },
  { id: "equipe-dev-full-stack", categoryId: "equipe", label: "Dev Full Stack" },
  { id: "equipe-dev-ia", categoryId: "equipe", label: "Dev IA" },
  { id: "cloud", categoryId: "cloud", label: "Infrastructure cloud" },
  { id: "outils", categoryId: "outils", label: "Outils SaaS internes" },
  { id: "marketing", categoryId: "marketing", label: "Marketing" },
  { id: "sales", categoryId: "sales", label: "Sales" },
  { id: "support", categoryId: "support", label: "Support client" },
  { id: "admin", categoryId: "admin", label: "Juridique et compta" },
  { id: "paiements", categoryId: "paiements", label: "Frais bancaires et paiement" },
  { id: "divers", categoryId: "divers", label: "Divers" },
];

const elements = {
  projectPicker: document.querySelector("#projectPicker"),
  showArchivedToggle: document.querySelector("#showArchivedToggle"),
  addProjectBtn: document.querySelector("#addProjectBtn"),
  archiveProjectBtn: document.querySelector("#archiveProjectBtn"),
  deleteProjectBtn: document.querySelector("#deleteProjectBtn"),
  projectEyebrow: document.querySelector("#projectEyebrow"),
  monthPicker: document.querySelector("#monthPicker"),
  plannedTotal: document.querySelector("#plannedTotal"),
  actualTotal: document.querySelector("#actualTotal"),
  varianceTotal: document.querySelector("#varianceTotal"),
  usageRate: document.querySelector("#usageRate"),
  budgetTableBody: document.querySelector("#budgetTableBody"),
  expenseTableBody: document.querySelector("#expenseTableBody"),
  alertsList: document.querySelector("#alertsList"),
  expenseForm: document.querySelector("#expenseForm"),
  expenseDate: document.querySelector("#expenseDate"),
  expenseCategory: document.querySelector("#expenseCategory"),
  expenseLine: document.querySelector("#expenseLine"),
  expenseVendor: document.querySelector("#expenseVendor"),
  expenseAmount: document.querySelector("#expenseAmount"),
  expenseRecurrence: document.querySelector("#expenseRecurrence"),
  expenseNote: document.querySelector("#expenseNote"),
  copyPreviousBtn: document.querySelector("#copyPreviousBtn"),
  exportCsvBtn: document.querySelector("#exportCsvBtn"),
  categoryChart: document.querySelector("#categoryChart"),
  trendChart: document.querySelector("#trendChart"),
};

const currencyFormatter = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat("fr-FR", {
  maximumFractionDigits: 1,
});

let showArchivedProjects = false;
let state = loadState();

function emptyState() {
  return {
    selectedProjectId: DEFAULT_PROJECT_ID,
    projects: defaultProjects.map((project) => ({ ...project })),
    budgetLines: {},
    budgets: {},
    expenses: [],
  };
}

function loadState() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) {
      return normalizeState(emptyState());
    }

    return normalizeState(JSON.parse(saved));
  } catch {
    return normalizeState(emptyState());
  }
}

function normalizeState(parsed) {
  const next = emptyState();

  if (!parsed || typeof parsed !== "object") {
    ensureAllProjectLines(next);
    return next;
  }

  next.projects = normalizeProjects(parsed.projects);
  next.selectedProjectId = projectExists(next, parsed.selectedProjectId) ? parsed.selectedProjectId : firstAvailableProject(next).id;
  next.budgetLines = normalizeBudgetLines(parsed.budgetLines, next.projects);
  ensureAllProjectLines(next);
  next.budgets = normalizeBudgets(parsed.budgets, next);
  next.expenses = normalizeExpenses(parsed.expenses, next);
  return next;
}

function normalizeProjects(rawProjects) {
  if (!Array.isArray(rawProjects)) {
    return defaultProjects.map((project) => ({ ...project }));
  }

  const seen = new Set();
  const projects = rawProjects
    .map((project) => ({
      id: sanitizeId(project.id || project.label || createId()),
      label: String(project.label || "Projet sans nom").trim(),
      eyebrow: String(project.eyebrow || `Projet ${project.label || "sans nom"}`).trim(),
      archived: Boolean(project.archived),
    }))
    .filter((project) => project.id && project.label)
    .filter((project) => {
      if (seen.has(project.id)) {
        return false;
      }
      seen.add(project.id);
      return true;
    });

  return projects.length > 0 ? projects : defaultProjects.map((project) => ({ ...project }));
}

function normalizeBudgetLines(rawBudgetLines, projects) {
  const linesByProject = {};

  if (rawBudgetLines && typeof rawBudgetLines === "object") {
    Object.entries(rawBudgetLines).forEach(([projectId, lines]) => {
      if (!Array.isArray(lines)) {
        return;
      }

      linesByProject[projectId] = lines
        .map((line) => ({
          id: sanitizeId(line.id || line.label || createId()),
          categoryId: categoryById(line.categoryId)?.id || "divers",
          label: String(line.label || "Ligne sans nom").trim(),
        }))
        .filter((line) => line.id && line.label);
    });
  }

  projects.forEach((project) => {
    if (!linesByProject[project.id]) {
      linesByProject[project.id] = [];
    }
  });

  return linesByProject;
}

function normalizeBudgets(rawBudgets, nextState) {
  const normalized = {};

  if (!rawBudgets || typeof rawBudgets !== "object") {
    return normalized;
  }

  const projectBudgets = looksLikeLegacyBudgets(rawBudgets) ? { [DEFAULT_PROJECT_ID]: rawBudgets } : rawBudgets;

  Object.entries(projectBudgets).forEach(([projectId, months]) => {
    const safeProjectId = projectExists(nextState, projectId) ? projectId : firstAvailableProject(nextState).id;
    if (!months || typeof months !== "object") {
      return;
    }

    Object.entries(months).forEach(([month, budgetRows]) => {
      if (!/^\d{4}-\d{2}$/.test(month) || !budgetRows || typeof budgetRows !== "object") {
        return;
      }

      Object.entries(budgetRows).forEach(([budgetKey, amount]) => {
        const lineId = resolveBudgetLineId(nextState, safeProjectId, budgetKey);
        if (!normalized[safeProjectId]) {
          normalized[safeProjectId] = {};
        }
        if (!normalized[safeProjectId][month]) {
          normalized[safeProjectId][month] = {};
        }
        normalized[safeProjectId][month][lineId] = toAmount(normalized[safeProjectId][month][lineId]) + toAmount(amount);
      });
    });
  });

  return normalized;
}

function normalizeExpenses(rawExpenses, nextState) {
  if (!Array.isArray(rawExpenses)) {
    return [];
  }

  return rawExpenses
    .map((expense) => {
      const projectId = projectExists(nextState, expense.projectId) ? expense.projectId : firstAvailableProject(nextState).id;
      const categoryId = categoryById(expense.categoryId)?.id || "divers";
      const lineId = resolveExpenseLineId(nextState, projectId, categoryId, expense.lineId);
      const date = String(expense.date || "");
      const month = /^\d{4}-\d{2}$/.test(expense.month || "") ? expense.month : date.slice(0, 7);

      return {
        id: expense.id || createId(),
        projectId,
        date,
        month,
        categoryId,
        lineId,
        vendor: String(expense.vendor || "").trim(),
        amount: toAmount(expense.amount),
        recurrence: String(expense.recurrence || "Récurrent"),
        note: String(expense.note || "").trim(),
      };
    })
    .filter((expense) => expense.date && expense.month && expense.vendor && expense.amount > 0);
}

function looksLikeLegacyBudgets(budgets) {
  return Object.keys(budgets).some((key) => /^\d{4}-\d{2}$/.test(key));
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function currentMonth() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
}

function selectedProjectId() {
  return elements.projectPicker.value || state.selectedProjectId || firstAvailableProject(state).id;
}

function selectedProject() {
  return projectById(selectedProjectId()) || firstAvailableProject(state);
}

function selectedMonth() {
  return elements.monthPicker.value || currentMonth();
}

function projectById(projectId) {
  return state.projects.find((project) => project.id === projectId);
}

function projectExists(sourceState, projectId) {
  return Boolean(sourceState.projects.find((project) => project.id === projectId));
}

function firstAvailableProject(sourceState) {
  return sourceState.projects.find((project) => !project.archived) || sourceState.projects[0] || defaultProjects[0];
}

function activeProjects() {
  return state.projects.filter((project) => !project.archived);
}

function visibleProjects() {
  return state.projects.filter((project) => !project.archived || showArchivedProjects);
}

function categoryById(categoryId) {
  return categories.find((category) => category.id === categoryId);
}

function monthLabel(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1, 1);
  return date.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" });
}

function previousMonth(month) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 2, 1);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

function addMonths(month, offset) {
  const [year, monthNumber] = month.split("-").map(Number);
  const date = new Date(year, monthNumber - 1 + offset, 1);
  return `${date.getFullYear()}-${`${date.getMonth() + 1}`.padStart(2, "0")}`;
}

function ensureAllProjectLines(sourceState) {
  sourceState.projects.forEach((project) => ensureProjectLines(sourceState, project.id));
}

function ensureProjectLines(sourceState, projectId) {
  if (!sourceState.budgetLines[projectId]) {
    sourceState.budgetLines[projectId] = [];
  }

  defaultLineTemplates.forEach((template) => {
    const exists = sourceState.budgetLines[projectId].some((line) => line.id === template.id);
    if (!exists) {
      sourceState.budgetLines[projectId].push({ ...template });
    }
  });
}

function resolveBudgetLineId(sourceState, projectId, budgetKey) {
  ensureProjectLines(sourceState, projectId);

  const existingLine = sourceState.budgetLines[projectId].find((line) => line.id === budgetKey);
  if (existingLine) {
    return existingLine.id;
  }

  const category = categoryById(budgetKey);
  if (category?.id === "equipe") {
    ensureLine(sourceState, projectId, { id: "equipe-general", categoryId: "equipe", label: "Équipe - général" });
    return "equipe-general";
  }

  if (category) {
    ensureLine(sourceState, projectId, { id: category.id, categoryId: category.id, label: category.label });
    return category.id;
  }

  ensureLine(sourceState, projectId, { id: sanitizeId(budgetKey), categoryId: "divers", label: String(budgetKey) });
  return sanitizeId(budgetKey);
}

function resolveExpenseLineId(sourceState, projectId, categoryId, candidateLineId) {
  ensureProjectLines(sourceState, projectId);

  const existingLine = sourceState.budgetLines[projectId].find((line) => line.id === candidateLineId);
  if (existingLine) {
    return existingLine.id;
  }

  if (categoryId === "equipe") {
    ensureLine(sourceState, projectId, { id: "equipe-general", categoryId: "equipe", label: "Équipe - général" });
    return "equipe-general";
  }

  ensureLine(sourceState, projectId, {
    id: categoryId,
    categoryId,
    label: categoryById(categoryId)?.label || "Divers",
  });
  return categoryId;
}

function ensureLine(sourceState, projectId, line) {
  if (!sourceState.budgetLines[projectId]) {
    sourceState.budgetLines[projectId] = [];
  }

  const exists = sourceState.budgetLines[projectId].some((item) => item.id === line.id);
  if (!exists) {
    sourceState.budgetLines[projectId].push({ ...line });
  }
}

function budgetLinesForProject(projectId) {
  ensureProjectLines(state, projectId);
  return state.budgetLines[projectId];
}

function budgetLinesForCategory(projectId, categoryId) {
  return budgetLinesForProject(projectId).filter((line) => line.categoryId === categoryId);
}

function budgetLineById(projectId, lineId) {
  return budgetLinesForProject(projectId).find((line) => line.id === lineId);
}

function expensesForProjectMonth(projectId, month) {
  return state.expenses.filter((expense) => expense.projectId === projectId && expense.month === month);
}

function toAmount(value) {
  const amount = Number.parseFloat(String(value).replace(",", "."));
  return Number.isFinite(amount) ? Math.max(amount, 0) : 0;
}

function getBudget(projectId, month, lineId) {
  return toAmount(state.budgets[projectId]?.[month]?.[lineId] || 0);
}

function setBudget(projectId, month, lineId, amount) {
  if (!state.budgets[projectId]) {
    state.budgets[projectId] = {};
  }

  if (!state.budgets[projectId][month]) {
    state.budgets[projectId][month] = {};
  }

  state.budgets[projectId][month][lineId] = amount;
  saveState();
}

function sum(numbers) {
  return numbers.reduce((total, value) => total + value, 0);
}

function plannedTotal(projectId, month) {
  return sum(budgetLinesForProject(projectId).map((line) => getBudget(projectId, month, line.id)));
}

function plannedByCategory(projectId, month, categoryId) {
  return sum(budgetLinesForCategory(projectId, categoryId).map((line) => getBudget(projectId, month, line.id)));
}

function actualTotal(projectId, month) {
  return sum(expensesForProjectMonth(projectId, month).map((expense) => toAmount(expense.amount)));
}

function actualByCategory(projectId, month, categoryId) {
  return sum(
    expensesForProjectMonth(projectId, month)
      .filter((expense) => expense.categoryId === categoryId)
      .map((expense) => toAmount(expense.amount)),
  );
}

function actualByLine(projectId, month, lineId) {
  return sum(
    expensesForProjectMonth(projectId, month)
      .filter((expense) => expense.lineId === lineId)
      .map((expense) => toAmount(expense.amount)),
  );
}

function formatCurrency(amount) {
  return currencyFormatter.format(amount);
}

function formatSignedCurrency(amount) {
  if (amount === 0) {
    return formatCurrency(0);
  }

  const sign = amount > 0 ? "+" : "-";
  return `${sign}${formatCurrency(Math.abs(amount))}`;
}

function init() {
  populateCategories();
  elements.showArchivedToggle.checked = showArchivedProjects;
  elements.monthPicker.value = currentMonth();
  elements.expenseDate.value = new Date().toISOString().slice(0, 10);
  populateProjects();
  elements.projectPicker.value = state.selectedProjectId;
  updateExpenseLineOptions();
  attachEvents();
  render();
}

function populateProjects() {
  const projects = visibleProjects();
  elements.projectPicker.innerHTML = projects
    .map((project) => {
      const suffix = project.archived ? " (archivé)" : "";
      return `<option value="${project.id}">${escapeHtml(project.label + suffix)}</option>`;
    })
    .join("");

  if (!projects.find((project) => project.id === state.selectedProjectId)) {
    state.selectedProjectId = firstAvailableProject(state).id;
  }

  elements.projectPicker.value = state.selectedProjectId;
}

function populateCategories() {
  elements.expenseCategory.innerHTML = categories
    .map((category) => `<option value="${category.id}">${escapeHtml(category.label)}</option>`)
    .join("");
}

function updateExpenseLineOptions() {
  const projectId = selectedProjectId();
  const categoryId = elements.expenseCategory.value || categories[0].id;
  const previousLineId = elements.expenseLine.value;
  const lines = budgetLinesForCategory(projectId, categoryId);
  elements.expenseLine.innerHTML = lines
    .map((line) => `<option value="${line.id}">${escapeHtml(line.label)}</option>`)
    .join("");

  if (lines.some((line) => line.id === previousLineId)) {
    elements.expenseLine.value = previousLineId;
  }
}

function attachEvents() {
  elements.projectPicker.addEventListener("change", () => {
    state.selectedProjectId = selectedProjectId();
    updateExpenseLineOptions();
    saveState();
    render();
  });

  elements.showArchivedToggle.addEventListener("change", () => {
    showArchivedProjects = elements.showArchivedToggle.checked;
    populateProjects();
    updateExpenseLineOptions();
    render();
  });

  elements.addProjectBtn.addEventListener("click", addProject);
  elements.archiveProjectBtn.addEventListener("click", archiveOrRestoreProject);
  elements.deleteProjectBtn.addEventListener("click", deleteProject);

  elements.monthPicker.addEventListener("change", () => {
    alignExpenseDateWithMonth();
    render();
  });

  elements.expenseCategory.addEventListener("change", updateExpenseLineOptions);

  elements.budgetTableBody.addEventListener("input", (event) => {
    const input = event.target.closest("[data-budget-input]");
    if (!input) {
      return;
    }

    setBudget(selectedProjectId(), selectedMonth(), input.dataset.lineId, toAmount(input.value));
    render({ keepBudgetFocus: input.dataset.lineId });
  });

  elements.budgetTableBody.addEventListener("change", (event) => {
    const input = event.target.closest("[data-line-name-input]");
    if (!input) {
      return;
    }

    renameBudgetLine(input.dataset.lineId, input.value);
  });

  elements.budgetTableBody.addEventListener("keydown", (event) => {
    const input = event.target.closest("[data-line-name-input]");
    if (!input || event.key !== "Enter") {
      return;
    }

    event.preventDefault();
    input.blur();
  });

  elements.budgetTableBody.addEventListener("click", (event) => {
    const addButton = event.target.closest("[data-add-line-category]");
    const removeButton = event.target.closest("[data-remove-line]");

    if (addButton) {
      addBudgetLine(addButton.dataset.addLineCategory);
      return;
    }

    if (removeButton) {
      removeBudgetLine(removeButton.dataset.removeLine);
    }
  });

  elements.expenseForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addExpense();
  });

  elements.expenseTableBody.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-expense]");
    if (!button) {
      return;
    }

    state.expenses = state.expenses.filter((expense) => expense.id !== button.dataset.deleteExpense);
    saveState();
    render();
  });

  elements.copyPreviousBtn.addEventListener("click", copyPreviousBudget);
  elements.exportCsvBtn.addEventListener("click", exportCsv);
  window.addEventListener("resize", renderCharts);
}

function addProject() {
  const label = window.prompt("Nom du nouveau projet");
  const trimmedLabel = label?.trim();
  if (!trimmedLabel) {
    return;
  }

  const project = {
    id: uniqueProjectId(trimmedLabel),
    label: trimmedLabel,
    eyebrow: `Projet ${trimmedLabel}`,
    archived: false,
  };

  state.projects.push(project);
  state.selectedProjectId = project.id;
  ensureProjectLines(state, project.id);
  showArchivedProjects = elements.showArchivedToggle.checked;
  saveState();
  populateProjects();
  updateExpenseLineOptions();
  render();
}

function archiveOrRestoreProject() {
  const project = selectedProject();

  if (project.archived) {
    project.archived = false;
    state.selectedProjectId = project.id;
    saveState();
    populateProjects();
    render();
    return;
  }

  if (activeProjects().length <= 1) {
    window.alert("Impossible d'archiver le dernier projet actif.");
    return;
  }

  if (!window.confirm(`Archiver le projet "${project.label}" ?`)) {
    return;
  }

  project.archived = true;
  showArchivedProjects = false;
  elements.showArchivedToggle.checked = false;
  state.selectedProjectId = firstAvailableProject(state).id;
  saveState();
  populateProjects();
  updateExpenseLineOptions();
  render();
}

function deleteProject() {
  const project = selectedProject();

  if (state.projects.length <= 1) {
    window.alert("Impossible de supprimer le dernier projet.");
    return;
  }

  const confirmed = window.confirm(
    `Supprimer définitivement "${project.label}" ? Les budgets et dépenses liés à ce projet seront supprimés.`,
  );
  if (!confirmed) {
    return;
  }

  state.projects = state.projects.filter((item) => item.id !== project.id);
  delete state.budgetLines[project.id];
  delete state.budgets[project.id];
  state.expenses = state.expenses.filter((expense) => expense.projectId !== project.id);
  state.selectedProjectId = firstAvailableProject(state).id;
  saveState();
  populateProjects();
  updateExpenseLineOptions();
  render();
}

function addBudgetLine(categoryId) {
  const projectId = selectedProjectId();
  const label = uniqueLineLabel(projectId, categoryId, "Nouvelle ligne");
  const line = {
    id: uniqueLineId(projectId, label),
    categoryId,
    label,
  };

  state.budgetLines[projectId].push(line);

  saveState();
  updateExpenseLineOptions();
  render({ keepNameFocus: line.id });
}

function renameBudgetLine(lineId, label) {
  const projectId = selectedProjectId();
  const line = budgetLineById(projectId, lineId);
  if (!line) {
    return;
  }

  const trimmedLabel = label.trim();
  if (!trimmedLabel) {
    render({ keepNameFocus: lineId });
    return;
  }

  line.label = trimmedLabel;
  saveState();
  updateExpenseLineOptions();
}

function removeBudgetLine(lineId) {
  const projectId = selectedProjectId();
  const line = budgetLineById(projectId, lineId);
  if (!line) {
    return;
  }

  if (budgetLinesForCategory(projectId, line.categoryId).length <= 1) {
    window.alert("Chaque catégorie doit garder au moins une ligne.");
    return;
  }

  if (budgetLineHasData(projectId, lineId)) {
    window.alert("Cette ligne contient déjà un budget ou une dépense. Mets son budget à 0 si elle ne doit plus être utilisée.");
    return;
  }

  state.budgetLines[projectId] = state.budgetLines[projectId].filter((item) => item.id !== lineId);
  saveState();
  updateExpenseLineOptions();
  render();
}

function budgetLineHasData(projectId, lineId) {
  const hasBudget = Object.values(state.budgets[projectId] || {}).some((monthBudget) => toAmount(monthBudget[lineId]) > 0);
  const hasExpense = state.expenses.some((expense) => expense.projectId === projectId && expense.lineId === lineId);
  return hasBudget || hasExpense;
}

function alignExpenseDateWithMonth() {
  const month = selectedMonth();
  if (!elements.expenseDate.value.startsWith(month)) {
    elements.expenseDate.value = `${month}-01`;
  }
}

function addExpense() {
  const date = elements.expenseDate.value;
  const line = budgetLineById(selectedProjectId(), elements.expenseLine.value);
  const expense = {
    id: createId(),
    projectId: selectedProjectId(),
    date,
    month: date.slice(0, 7),
    categoryId: elements.expenseCategory.value,
    lineId: line?.id || elements.expenseLine.value,
    vendor: elements.expenseVendor.value.trim(),
    amount: toAmount(elements.expenseAmount.value),
    recurrence: elements.expenseRecurrence.value,
    note: elements.expenseNote.value.trim(),
  };

  if (!expense.date || !expense.categoryId || !expense.lineId || !expense.vendor || expense.amount <= 0) {
    return;
  }

  state.expenses.push(expense);
  saveState();

  elements.monthPicker.value = expense.month;
  elements.expenseForm.reset();
  elements.expenseDate.value = expense.date;
  elements.expenseCategory.value = expense.categoryId;
  updateExpenseLineOptions();
  elements.expenseLine.value = expense.lineId;
  elements.expenseRecurrence.value = "Récurrent";
  render();
}

function copyPreviousBudget() {
  const projectId = selectedProjectId();
  const project = selectedProject();
  const month = selectedMonth();
  const sourceMonth = previousMonth(month);
  const sourceBudget = state.budgets[projectId]?.[sourceMonth];

  if (!sourceBudget) {
    window.alert(`Aucun budget trouvé sur ${project.label} pour le mois précédent.`);
    return;
  }

  if (!state.budgets[projectId]) {
    state.budgets[projectId] = {};
  }

  state.budgets[projectId][month] = { ...sourceBudget };
  saveState();
  render();
}

function render(options = {}) {
  const project = selectedProject();
  const month = selectedMonth();
  elements.projectEyebrow.textContent = project.eyebrow;
  document.title = `Budget Hyperfluid - ${project.label}`;
  renderProjectActions(project);
  renderMetrics(project.id, month);
  renderBudgetTable(project.id, month, options);
  renderExpenseTable(project.id, month);
  renderAlerts(project.id, month);
  renderCharts();
}

function renderProjectActions(project) {
  elements.archiveProjectBtn.textContent = project.archived ? "Restaurer" : "Archiver";
  elements.archiveProjectBtn.disabled = !project.archived && activeProjects().length <= 1;
  elements.deleteProjectBtn.disabled = state.projects.length <= 1;
}

function renderMetrics(projectId, month) {
  const planned = plannedTotal(projectId, month);
  const actual = actualTotal(projectId, month);
  const variance = actual - planned;
  const usage = planned > 0 ? (actual / planned) * 100 : actual > 0 ? 100 : 0;

  elements.plannedTotal.textContent = formatCurrency(planned);
  elements.actualTotal.textContent = formatCurrency(actual);
  elements.varianceTotal.textContent = formatSignedCurrency(variance);
  elements.usageRate.textContent = `${percentFormatter.format(usage)} %`;

  const varianceCard = elements.varianceTotal.closest(".metric-card");
  const usageCard = elements.usageRate.closest(".metric-card");
  varianceCard.classList.toggle("negative", variance > 0);
  varianceCard.classList.toggle("positive", variance < 0);
  varianceCard.classList.toggle("warning", variance === 0);
  usageCard.classList.toggle("negative", usage > 100);
  usageCard.classList.toggle("warning", usage >= 80 && usage <= 100);
  usageCard.classList.toggle("positive", usage < 80);
}

function renderBudgetTable(projectId, month, options = {}) {
  elements.budgetTableBody.innerHTML = categories
    .map((category) => renderCategoryRows(projectId, month, category))
    .join("");

  if (options.keepBudgetFocus) {
    const focusedInput = elements.budgetTableBody.querySelector(
      `[data-budget-input][data-line-id="${options.keepBudgetFocus}"]`,
    );
    if (focusedInput) {
      focusedInput.focus();
      try {
        const length = focusedInput.value.length;
        focusedInput.setSelectionRange(length, length);
      } catch {
        // Number inputs do not expose selection APIs in every browser.
      }
    }
  }

  if (options.keepNameFocus) {
    const focusedInput = elements.budgetTableBody.querySelector(
      `[data-line-name-input][data-line-id="${options.keepNameFocus}"]`,
    );
    if (focusedInput) {
      focusedInput.focus();
      focusedInput.select();
    }
  }
}

function renderCategoryRows(projectId, month, category) {
  const lines = budgetLinesForCategory(projectId, category.id);
  const budget = plannedByCategory(projectId, month, category.id);
  const actual = actualByCategory(projectId, month, category.id);
  const variance = actual - budget;
  const usage = budget > 0 ? (actual / budget) * 100 : actual > 0 ? 100 : 0;
  const status = statusForBudget(budget, actual, usage);
  const lineRows = lines.map((line) => renderBudgetLineRow(projectId, month, category, line)).join("");

  return `
    <tr class="category-row">
      <td>
        <span class="category-cell">
          <span class="color-dot" style="background:${category.color}"></span>
          ${escapeHtml(category.label)}
        </span>
      </td>
      <td>${formatCurrency(budget)}</td>
      <td>${formatCurrency(actual)}</td>
      <td>${formatSignedCurrency(variance)}</td>
      <td><span class="status-pill ${status.className}">${status.label}</span></td>
      <td>
        <button class="link-button" type="button" data-add-line-category="${category.id}">
          Ajouter une ligne
        </button>
      </td>
    </tr>
    ${lineRows}
  `;
}

function renderBudgetLineRow(projectId, month, category, line) {
  const budget = getBudget(projectId, month, line.id);
  const actual = actualByLine(projectId, month, line.id);
  const variance = actual - budget;
  const usage = budget > 0 ? (actual / budget) * 100 : actual > 0 ? 100 : 0;
  const status = statusForBudget(budget, actual, usage);

  return `
    <tr class="line-row">
      <td>
        <span class="category-cell child">
          <span class="color-dot" style="background:${category.color}"></span>
          <input
            class="line-name-input"
            type="text"
            value="${escapeHtml(line.label)}"
            data-line-name-input
            data-line-id="${line.id}"
            aria-label="Nom de la ligne ${escapeHtml(line.label)}"
          />
        </span>
      </td>
      <td>
        <input
          class="money-input"
          type="number"
          min="0"
          step="0.01"
          value="${budget || ""}"
          data-budget-input
          data-line-id="${line.id}"
          aria-label="Budget prévu ${escapeHtml(line.label)}"
        />
      </td>
      <td>${formatCurrency(actual)}</td>
      <td>${formatSignedCurrency(variance)}</td>
      <td><span class="status-pill ${status.className}">${status.label}</span></td>
      <td>
        <button class="link-button danger" type="button" data-remove-line="${line.id}">
          Retirer
        </button>
      </td>
    </tr>
  `;
}

function statusForBudget(budget, actual, usage) {
  if (budget === 0 && actual === 0) {
    return { label: "Non budgété", className: "watch" };
  }

  if (budget === 0 && actual > 0) {
    return { label: "À cadrer", className: "bad" };
  }

  if (usage > 100) {
    return { label: "Dépassement", className: "bad" };
  }

  if (usage >= 80) {
    return { label: "À surveiller", className: "watch" };
  }

  return { label: "Sous budget", className: "good" };
}

function renderExpenseTable(projectId, month) {
  const expenses = expensesForProjectMonth(projectId, month).sort((a, b) => b.date.localeCompare(a.date));

  if (expenses.length === 0) {
    elements.expenseTableBody.innerHTML = `
      <tr>
        <td class="muted-row" colspan="6">Aucune dépense sur ce projet pour ce mois.</td>
      </tr>
    `;
    return;
  }

  elements.expenseTableBody.innerHTML = expenses
    .map((expense) => {
      const category = categoryById(expense.categoryId) || categories[categories.length - 1];
      const line = budgetLineById(projectId, expense.lineId);
      return `
        <tr title="${escapeHtml(expense.note || expense.recurrence)}">
          <td>${formatDate(expense.date)}</td>
          <td>${escapeHtml(expense.vendor)}</td>
          <td>
            <span class="category-cell">
              <span class="color-dot" style="background:${category.color}"></span>
              ${escapeHtml(category.label)}
            </span>
          </td>
          <td>${escapeHtml(line?.label || "Ligne supprimée")}</td>
          <td>${formatCurrency(expense.amount)}</td>
          <td>
            <button class="icon-button" type="button" data-delete-expense="${expense.id}" aria-label="Supprimer ${escapeHtml(expense.vendor)}">
              ×
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderAlerts(projectId, month) {
  const project = projectById(projectId) || firstAvailableProject(state);
  const rows = categories.map((category) => {
    const budget = plannedByCategory(projectId, month, category.id);
    const actual = actualByCategory(projectId, month, category.id);
    const usage = budget > 0 ? (actual / budget) * 100 : actual > 0 ? 100 : 0;
    return { category, budget, actual, usage, variance: actual - budget };
  });

  const alerts = rows
    .filter((row) => row.actual > 0 || row.budget > 0)
    .map((row) => {
      if (row.budget === 0 && row.actual > 0) {
        return {
          type: "danger",
          title: `${row.category.label} n'a pas de budget`,
          body: `${formatCurrency(row.actual)} dépensés sans prévisionnel sur ${project.label}.`,
        };
      }

      if (row.variance > 0) {
        return {
          type: "danger",
          title: `${row.category.label} dépasse le budget`,
          body: `${formatSignedCurrency(row.variance)} vs le budget prévu sur ${project.label}.`,
        };
      }

      if (row.usage >= 80) {
        return {
          type: "warning",
          title: `${row.category.label} approche du budget`,
          body: `${percentFormatter.format(row.usage)} % du budget consommé sur ${project.label}.`,
        };
      }

      return null;
    })
    .filter(Boolean);

  if (alerts.length === 0) {
    elements.alertsList.innerHTML = `
      <div class="alert-item good">
        <strong>Budget maîtrisé</strong>
        <span>Aucun dépassement détecté sur ${project.label} pour ${monthLabel(month)}.</span>
      </div>
    `;
    return;
  }

  elements.alertsList.innerHTML = alerts
    .slice(0, 8)
    .map(
      (alert) => `
        <div class="alert-item ${alert.type}">
          <strong>${alert.title}</strong>
          <span>${alert.body}</span>
        </div>
      `,
    )
    .join("");
}

function renderCharts() {
  const projectId = selectedProjectId();
  const month = selectedMonth();
  drawCategoryChart(projectId, month);
  drawTrendChart(projectId, month);
}

function setupCanvas(canvas) {
  const ratio = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  canvas.width = Math.max(1, Math.floor(rect.width * ratio));
  canvas.height = Math.max(1, Math.floor(rect.height * ratio));
  const context = canvas.getContext("2d");
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, rect.width, rect.height);
  return { context, width: rect.width, height: rect.height };
}

function drawCategoryChart(projectId, month) {
  const { context, width, height } = setupCanvas(elements.categoryChart);
  const rows = categories.map((category) => ({
    category,
    budget: plannedByCategory(projectId, month, category.id),
    actual: actualByCategory(projectId, month, category.id),
  }));
  const maxValue = Math.max(1, ...rows.flatMap((row) => [row.budget, row.actual]));
  const left = width < 560 ? 118 : 172;
  const right = 22;
  const rowHeight = Math.max(22, (height - 22) / rows.length);
  const barMaxWidth = Math.max(80, width - left - right);

  context.font = "12px Inter, system-ui, sans-serif";
  context.textBaseline = "middle";

  rows.forEach((row, index) => {
    const y = 18 + index * rowHeight;
    const budgetWidth = (row.budget / maxValue) * barMaxWidth;
    const actualWidth = (row.actual / maxValue) * barMaxWidth;

    context.fillStyle = "#475467";
    context.fillText(truncateText(context, row.category.label, left - 18), 0, y + 8);

    roundedRect(context, left, y, barMaxWidth, 9, 5, "#edf2f7");
    roundedRect(context, left, y, budgetWidth, 9, 5, "#94a3b8");
    roundedRect(context, left, y + 13, barMaxWidth, 9, 5, "#edf2f7");
    roundedRect(context, left, y + 13, actualWidth, 9, 5, row.category.color);
  });

  drawLegend(context, width, height, [
    { label: "Budget", color: "#94a3b8" },
    { label: "Réel", color: "#2563eb" },
  ]);
}

function drawTrendChart(projectId, month) {
  const { context, width, height } = setupCanvas(elements.trendChart);
  const months = Array.from({ length: 6 }, (_, index) => addMonths(month, index - 5));
  const rows = months.map((item) => ({
    month: item,
    budget: plannedTotal(projectId, item),
    actual: actualTotal(projectId, item),
  }));
  const maxValue = Math.max(1, ...rows.flatMap((row) => [row.budget, row.actual]));
  const padding = { top: 18, right: 18, bottom: 42, left: 48 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const groupWidth = chartWidth / rows.length;
  const barWidth = Math.min(24, groupWidth / 4);

  context.strokeStyle = "#d9e1ea";
  context.lineWidth = 1;
  context.beginPath();
  context.moveTo(padding.left, padding.top + chartHeight);
  context.lineTo(width - padding.right, padding.top + chartHeight);
  context.stroke();

  rows.forEach((row, index) => {
    const baseX = padding.left + index * groupWidth + groupWidth / 2;
    const budgetHeight = (row.budget / maxValue) * chartHeight;
    const actualHeight = (row.actual / maxValue) * chartHeight;
    const baseY = padding.top + chartHeight;

    roundedRect(context, baseX - barWidth - 2, baseY - budgetHeight, barWidth, budgetHeight, 4, "#94a3b8");
    roundedRect(context, baseX + 2, baseY - actualHeight, barWidth, actualHeight, 4, "#2563eb");

    context.fillStyle = "#667085";
    context.font = "12px Inter, system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText(monthLabel(row.month), baseX, height - 15);
  });

  context.textAlign = "left";
  drawLegend(context, width, height, [
    { label: "Budget", color: "#94a3b8" },
    { label: "Réel", color: "#2563eb" },
  ]);
}

function roundedRect(context, x, y, width, height, radius, color) {
  const safeWidth = Math.max(0, width);
  const safeHeight = Math.max(0, height);
  const safeRadius = Math.min(radius, safeHeight / 2, safeWidth / 2);

  context.fillStyle = color;
  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + safeWidth - safeRadius, y);
  context.quadraticCurveTo(x + safeWidth, y, x + safeWidth, y + safeRadius);
  context.lineTo(x + safeWidth, y + safeHeight - safeRadius);
  context.quadraticCurveTo(x + safeWidth, y + safeHeight, x + safeWidth - safeRadius, y + safeHeight);
  context.lineTo(x + safeRadius, y + safeHeight);
  context.quadraticCurveTo(x, y + safeHeight, x, y + safeHeight - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.fill();
}

function drawLegend(context, width, height, items) {
  const itemWidth = 86;
  const startX = Math.max(0, width - itemWidth * items.length - 4);
  const y = height - 8;

  items.forEach((item, index) => {
    const x = startX + index * itemWidth;
    roundedRect(context, x, y - 8, 12, 12, 3, item.color);
    context.fillStyle = "#667085";
    context.font = "12px Inter, system-ui, sans-serif";
    context.textAlign = "left";
    context.fillText(item.label, x + 17, y - 2);
  });
}

function truncateText(context, text, maxWidth) {
  if (context.measureText(text).width <= maxWidth) {
    return text;
  }

  let shortened = text;
  while (shortened.length > 3 && context.measureText(`${shortened}...`).width > maxWidth) {
    shortened = shortened.slice(0, -1);
  }

  return `${shortened}...`;
}

function exportCsv() {
  const project = selectedProject();
  const month = selectedMonth();
  const rows = [
    ["Type", "Projet", "Mois", "Date", "Catégorie", "Ligne", "Fournisseur", "Budget prévu", "Réel", "Récurrence", "Note"],
  ];

  budgetLinesForProject(project.id).forEach((line) => {
    const category = categoryById(line.categoryId) || categories[categories.length - 1];
    rows.push([
      "Budget",
      project.label,
      month,
      "",
      category.label,
      line.label,
      "",
      getBudget(project.id, month, line.id),
      "",
      "",
      "",
    ]);
  });

  expensesForProjectMonth(project.id, month).forEach((expense) => {
    const line = budgetLineById(project.id, expense.lineId);
    rows.push([
      "Dépense",
      project.label,
      expense.month,
      expense.date,
      categoryById(expense.categoryId)?.label || "Divers",
      line?.label || "Ligne supprimée",
      expense.vendor,
      "",
      expense.amount,
      expense.recurrence,
      expense.note,
    ]);
  });

  const csv = rows.map((row) => row.map(csvCell).join(";")).join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `budget-hyperfluid-${project.id}-${month}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function createId() {
  return window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random()}`;
}

function uniqueProjectId(label) {
  const base = sanitizeId(label) || "projet";
  let candidate = base;
  let index = 2;

  while (state.projects.some((project) => project.id === candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }

  return candidate;
}

function uniqueLineId(projectId, label) {
  const base = `ligne-${sanitizeId(label) || "budget"}`;
  let candidate = base;
  let index = 2;

  while (budgetLinesForProject(projectId).some((line) => line.id === candidate)) {
    candidate = `${base}-${index}`;
    index += 1;
  }

  return candidate;
}

function uniqueLineLabel(projectId, categoryId, baseLabel) {
  const labels = budgetLinesForCategory(projectId, categoryId).map((line) => line.label.toLowerCase());
  let candidate = baseLabel;
  let index = 2;

  while (labels.includes(candidate.toLowerCase())) {
    candidate = `${baseLabel} ${index}`;
    index += 1;
  }

  return candidate;
}

function sanitizeId(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

function csvCell(value) {
  const text = String(value ?? "");
  return `"${text.replaceAll('"', '""')}"`;
}

function formatDate(value) {
  const [year, month, day] = value.split("-");
  return `${day}/${month}/${year}`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

init();
