const STORAGE_KEY = "budget-saas-v1";
const DEFAULT_PROJECT_ID = "app-v2";
const NO_LOT = "";

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
  { id: "equipe-ux-ui", categoryId: "equipe", label: "UX/UI", lotId: NO_LOT },
  { id: "equipe-dev-full-stack", categoryId: "equipe", label: "Dev Full Stack", lotId: NO_LOT },
  { id: "equipe-dev-ia", categoryId: "equipe", label: "Dev IA", lotId: NO_LOT },
  { id: "cloud", categoryId: "cloud", label: "Infrastructure cloud", lotId: NO_LOT },
  { id: "outils", categoryId: "outils", label: "Outils SaaS internes", lotId: NO_LOT },
  { id: "marketing", categoryId: "marketing", label: "Marketing", lotId: NO_LOT },
  { id: "sales", categoryId: "sales", label: "Sales", lotId: NO_LOT },
  { id: "support", categoryId: "support", label: "Support client", lotId: NO_LOT },
  { id: "admin", categoryId: "admin", label: "Juridique et compta", lotId: NO_LOT },
  { id: "paiements", categoryId: "paiements", label: "Frais bancaires et paiement", lotId: NO_LOT },
  { id: "divers", categoryId: "divers", label: "Divers", lotId: NO_LOT },
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
  globalPlannedTotal: document.querySelector("#globalPlannedTotal"),
  globalActualTotal: document.querySelector("#globalActualTotal"),
  globalVarianceTotal: document.querySelector("#globalVarianceTotal"),
  globalRemainingTotal: document.querySelector("#globalRemainingTotal"),
  globalUsageRate: document.querySelector("#globalUsageRate"),

  lotForm: document.querySelector("#lotForm"),
  lotName: document.querySelector("#lotName"),
  lotDescription: document.querySelector("#lotDescription"),
  lotStartDate: document.querySelector("#lotStartDate"),
  lotEndDate: document.querySelector("#lotEndDate"),
  lotBudget: document.querySelector("#lotBudget"),
  lotStatus: document.querySelector("#lotStatus"),
  lotTableBody: document.querySelector("#lotTableBody"),

  budgetTableBody: document.querySelector("#budgetTableBody"),
  expenseTableBody: document.querySelector("#expenseTableBody"),
  alertsList: document.querySelector("#alertsList"),
  expenseForm: document.querySelector("#expenseForm"),
  expenseDate: document.querySelector("#expenseDate"),
  expenseCategory: document.querySelector("#expenseCategory"),
  expenseLine: document.querySelector("#expenseLine"),
  expenseLot: document.querySelector("#expenseLot"),
  expenseVendor: document.querySelector("#expenseVendor"),
  expenseAmount: document.querySelector("#expenseAmount"),
  expenseRecurrence: document.querySelector("#expenseRecurrence"),
  expenseNote: document.querySelector("#expenseNote"),

  invoiceForm: document.querySelector("#invoiceForm"),
  invoiceFile: document.querySelector("#invoiceFile"),
  invoiceVendor: document.querySelector("#invoiceVendor"),
  invoiceNumber: document.querySelector("#invoiceNumber"),
  invoiceDate: document.querySelector("#invoiceDate"),
  invoiceMonth: document.querySelector("#invoiceMonth"),
  invoiceAmount: document.querySelector("#invoiceAmount"),
  invoiceVat: document.querySelector("#invoiceVat"),
  invoiceCategory: document.querySelector("#invoiceCategory"),
  invoiceLine: document.querySelector("#invoiceLine"),
  invoiceLot: document.querySelector("#invoiceLot"),
  invoiceStatus: document.querySelector("#invoiceStatus"),
  invoiceNote: document.querySelector("#invoiceNote"),
  invoiceTableBody: document.querySelector("#invoiceTableBody"),

  copyPreviousBtn: document.querySelector("#copyPreviousBtn"),
  exportCsvBtn: document.querySelector("#exportCsvBtn"),
  monthlyComparisonChart: document.querySelector("#monthlyComparisonChart"),
  categoryChart: document.querySelector("#categoryChart"),
  trendChart: document.querySelector("#trendChart"),
  vendorChart: document.querySelector("#vendorChart"),
  lotChart: document.querySelector("#lotChart"),
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
let pendingInvoiceFile = null;
let state = loadState();

function emptyState() {
  return {
    selectedProjectId: DEFAULT_PROJECT_ID,
    projects: defaultProjects.map((project) => ({ ...project })),
    budgetLines: {},
    budgets: {},
    expenses: [],
    lots: {},
    invoices: [],
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
    ensureAllProjectLots(next);
    return next;
  }

  next.projects = normalizeProjects(parsed.projects);
  next.selectedProjectId = projectExists(next, parsed.selectedProjectId) ? parsed.selectedProjectId : firstAvailableProject(next).id;
  next.lots = normalizeLots(parsed.lots, next.projects);
  next.budgetLines = normalizeBudgetLines(parsed.budgetLines, next.projects);
  ensureAllProjectLines(next);
  ensureAllProjectLots(next);
  next.budgets = normalizeBudgets(parsed.budgets, next);
  next.expenses = normalizeExpenses(parsed.expenses, next);
  next.invoices = normalizeInvoices(parsed.invoices, next);
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

function normalizeLots(rawLots, projects) {
  const lotsByProject = {};
  projects.forEach((project) => {
    lotsByProject[project.id] = [];
  });

  if (!rawLots || typeof rawLots !== "object") {
    return lotsByProject;
  }

  Object.entries(rawLots).forEach(([projectId, lots]) => {
    if (!Array.isArray(lots) || !lotsByProject[projectId]) {
      return;
    }

    lotsByProject[projectId] = lots
      .map((lot) => ({
        id: sanitizeId(lot.id || lot.name || createId()),
        name: String(lot.name || "Lot sans nom").trim(),
        description: String(lot.description || "").trim(),
        startDate: normalizeDate(lot.startDate),
        endDate: normalizeDate(lot.endDate),
        budget: toAmount(lot.budget),
        status: normalizeLotStatus(lot.status),
      }))
      .filter((lot) => lot.id && lot.name);
  });

  return lotsByProject;
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
          lotId: String(line.lotId || NO_LOT),
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
      const date = normalizeDate(expense.date);
      const month = /^\d{4}-\d{2}$/.test(expense.month || "") ? expense.month : date.slice(0, 7);
      const lotId = normalizeLotId(nextState, projectId, expense.lotId);

      return {
        id: expense.id || createId(),
        projectId,
        lotId,
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

function normalizeInvoices(rawInvoices, nextState) {
  if (!Array.isArray(rawInvoices)) {
    return [];
  }

  return rawInvoices
    .map((invoice) => {
      const projectId = projectExists(nextState, invoice.projectId) ? invoice.projectId : firstAvailableProject(nextState).id;
      const categoryId = categoryById(invoice.categoryId)?.id || "divers";
      const lineId = resolveExpenseLineId(nextState, projectId, categoryId, invoice.lineId);
      const date = normalizeDate(invoice.date);
      const month = /^\d{4}-\d{2}$/.test(invoice.month || "") ? invoice.month : date.slice(0, 7);

      return {
        id: invoice.id || createId(),
        projectId,
        lotId: normalizeLotId(nextState, projectId, invoice.lotId),
        categoryId,
        lineId,
        vendor: String(invoice.vendor || "").trim(),
        date,
        month,
        amount: toAmount(invoice.amount),
        vat: toAmount(invoice.vat),
        invoiceNumber: String(invoice.invoiceNumber || "").trim(),
        status: invoice.status === "Validée" ? "Validée" : "À valider",
        fileName: String(invoice.fileName || "").trim(),
        fileType: String(invoice.fileType || "").trim(),
        fileData: String(invoice.fileData || ""),
        note: String(invoice.note || "").trim(),
      };
    })
    .filter((invoice) => invoice.date && invoice.month && invoice.vendor && invoice.amount > 0);
}

function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function init() {
  populateCategories();
  elements.showArchivedToggle.checked = showArchivedProjects;
  elements.monthPicker.value = currentMonth();
  elements.expenseDate.value = new Date().toISOString().slice(0, 10);
  elements.invoiceDate.value = new Date().toISOString().slice(0, 10);
  elements.invoiceMonth.value = currentMonth();
  populateProjects();
  elements.projectPicker.value = state.selectedProjectId;
  updateLotOptions();
  updateExpenseLineOptions();
  updateInvoiceLineOptions();
  attachEvents();
  render();
}

function attachEvents() {
  elements.projectPicker.addEventListener("change", () => {
    state.selectedProjectId = selectedProjectId();
    updateLotOptions();
    updateExpenseLineOptions();
    updateInvoiceLineOptions();
    saveState();
    render();
  });

  elements.showArchivedToggle.addEventListener("change", () => {
    showArchivedProjects = elements.showArchivedToggle.checked;
    populateProjects();
    updateLotOptions();
    updateExpenseLineOptions();
    updateInvoiceLineOptions();
    render();
  });

  elements.addProjectBtn.addEventListener("click", addProject);
  elements.archiveProjectBtn.addEventListener("click", archiveOrRestoreProject);
  elements.deleteProjectBtn.addEventListener("click", deleteProject);
  elements.monthPicker.addEventListener("change", () => {
    alignExpenseDateWithMonth();
    render();
  });

  elements.lotForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addLot();
  });

  elements.expenseCategory.addEventListener("change", updateExpenseLineOptions);
  elements.invoiceCategory.addEventListener("change", updateInvoiceLineOptions);
  elements.invoiceFile.addEventListener("change", handleInvoiceFile);

  [elements.expenseAmount, elements.lotBudget, elements.invoiceAmount, elements.invoiceVat].forEach((input) => {
    input.addEventListener("blur", () => {
      input.value = formatInputAmount(toAmount(input.value));
    });
  });

  elements.budgetTableBody.addEventListener("focusout", (event) => {
    const budgetInput = event.target.closest("[data-budget-input]");
    if (budgetInput) {
      saveBudgetInput(budgetInput);
      return;
    }

    const nameInput = event.target.closest("[data-line-name-input]");
    if (nameInput) {
      renameBudgetLine(nameInput.dataset.lineId, nameInput.value);
    }
  });

  elements.budgetTableBody.addEventListener("change", (event) => {
    const lotSelect = event.target.closest("[data-line-lot-select]");
    if (lotSelect) {
      setBudgetLineLot(lotSelect.dataset.lineId, lotSelect.value);
    }
  });

  elements.budgetTableBody.addEventListener("keydown", (event) => {
    const input = event.target.closest("[data-budget-input], [data-line-name-input]");
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

  elements.lotTableBody.addEventListener("click", (event) => {
    const deleteButton = event.target.closest("[data-delete-lot]");
    if (deleteButton) {
      deleteLot(deleteButton.dataset.deleteLot);
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

  elements.invoiceForm.addEventListener("submit", (event) => {
    event.preventDefault();
    addInvoice();
  });

  elements.invoiceTableBody.addEventListener("click", (event) => {
    const validateButton = event.target.closest("[data-validate-invoice]");
    const deleteButton = event.target.closest("[data-delete-invoice]");

    if (validateButton) {
      validateInvoice(validateButton.dataset.validateInvoice);
      return;
    }

    if (deleteButton) {
      deleteInvoice(deleteButton.dataset.deleteInvoice);
    }
  });

  elements.copyPreviousBtn.addEventListener("click", copyPreviousBudget);
  elements.exportCsvBtn.addEventListener("click", exportCsv);
  window.addEventListener("resize", renderCharts);
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
  const options = categories.map((category) => `<option value="${category.id}">${escapeHtml(category.label)}</option>`).join("");
  elements.expenseCategory.innerHTML = options;
  elements.invoiceCategory.innerHTML = options;
}

function updateLotOptions() {
  const lots = lotsForProject(selectedProjectId());
  const options = [
    `<option value="${NO_LOT}">Aucun lot</option>`,
    ...lots.map((lot) => `<option value="${lot.id}">${escapeHtml(lot.name)}</option>`),
  ].join("");

  elements.expenseLot.innerHTML = options;
  elements.invoiceLot.innerHTML = options;
}

function updateExpenseLineOptions() {
  updateLineOptions(elements.expenseLine, elements.expenseCategory.value || categories[0].id);
}

function updateInvoiceLineOptions() {
  updateLineOptions(elements.invoiceLine, elements.invoiceCategory.value || categories[0].id);
}

function updateLineOptions(select, categoryId) {
  const projectId = selectedProjectId();
  const previousLineId = select.value;
  const lines = budgetLinesForCategory(projectId, categoryId);
  select.innerHTML = lines.map((line) => `<option value="${line.id}">${escapeHtml(line.label)}</option>`).join("");

  if (lines.some((line) => line.id === previousLineId)) {
    select.value = previousLineId;
  }
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
  state.lots[project.id] = [];
  ensureProjectLines(state, project.id);
  showArchivedProjects = elements.showArchivedToggle.checked;
  saveState();
  populateProjects();
  updateLotOptions();
  updateExpenseLineOptions();
  updateInvoiceLineOptions();
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
  updateLotOptions();
  updateExpenseLineOptions();
  updateInvoiceLineOptions();
  render();
}

function deleteProject() {
  const project = selectedProject();

  if (state.projects.length <= 1) {
    window.alert("Impossible de supprimer le dernier projet.");
    return;
  }

  const confirmed = window.confirm(
    `Supprimer définitivement "${project.label}" ? Les budgets, lots, factures et dépenses liés à ce projet seront supprimés.`,
  );
  if (!confirmed) {
    return;
  }

  state.projects = state.projects.filter((item) => item.id !== project.id);
  delete state.budgetLines[project.id];
  delete state.budgets[project.id];
  delete state.lots[project.id];
  state.expenses = state.expenses.filter((expense) => expense.projectId !== project.id);
  state.invoices = state.invoices.filter((invoice) => invoice.projectId !== project.id);
  state.selectedProjectId = firstAvailableProject(state).id;
  saveState();
  populateProjects();
  updateLotOptions();
  updateExpenseLineOptions();
  updateInvoiceLineOptions();
  render();
}

function addLot() {
  const projectId = selectedProjectId();
  const name = elements.lotName.value.trim();
  if (!name) {
    return;
  }

  const lot = {
    id: uniqueLotId(projectId, name),
    name,
    description: elements.lotDescription.value.trim(),
    startDate: elements.lotStartDate.value,
    endDate: elements.lotEndDate.value,
    budget: toAmount(elements.lotBudget.value),
    status: elements.lotStatus.value,
  };

  state.lots[projectId].push(lot);
  saveState();
  elements.lotForm.reset();
  elements.lotStatus.value = "Prévu";
  updateLotOptions();
  render();
}

function deleteLot(lotId) {
  const projectId = selectedProjectId();
  if (lotHasData(projectId, lotId)) {
    window.alert("Ce lot est déjà rattaché à un budget, une dépense ou une facture. Retire d'abord ces rattachements.");
    return;
  }

  state.lots[projectId] = lotsForProject(projectId).filter((lot) => lot.id !== lotId);
  saveState();
  updateLotOptions();
  render();
}

function addBudgetLine(categoryId) {
  const projectId = selectedProjectId();
  const label = uniqueLineLabel(projectId, categoryId, "Nouvelle ligne");
  const line = {
    id: uniqueLineId(projectId, label),
    categoryId,
    label,
    lotId: NO_LOT,
  };

  state.budgetLines[projectId].push(line);
  saveState();
  updateExpenseLineOptions();
  updateInvoiceLineOptions();
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
  updateInvoiceLineOptions();
}

function setBudgetLineLot(lineId, lotId) {
  const projectId = selectedProjectId();
  const line = budgetLineById(projectId, lineId);
  if (!line) {
    return;
  }

  line.lotId = normalizeLotId(state, projectId, lotId);
  saveState();
  render();
}

function saveBudgetInput(input) {
  setBudget(selectedProjectId(), selectedMonth(), input.dataset.lineId, toAmount(input.value));
  render();
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
    window.alert("Cette ligne contient déjà un budget, une dépense ou une facture. Mets son budget à 0 si elle ne doit plus être utilisée.");
    return;
  }

  state.budgetLines[projectId] = state.budgetLines[projectId].filter((item) => item.id !== lineId);
  saveState();
  updateExpenseLineOptions();
  updateInvoiceLineOptions();
  render();
}

function addExpense() {
  const date = elements.expenseDate.value;
  const line = budgetLineById(selectedProjectId(), elements.expenseLine.value);
  const expense = {
    id: createId(),
    projectId: selectedProjectId(),
    lotId: elements.expenseLot.value,
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
  updateLotOptions();
  elements.expenseLot.value = expense.lotId;
  updateExpenseLineOptions();
  elements.expenseLine.value = expense.lineId;
  elements.expenseRecurrence.value = "Récurrent";
  render();
}

async function handleInvoiceFile() {
  const file = elements.invoiceFile.files?.[0];
  if (!file) {
    pendingInvoiceFile = null;
    return;
  }

  pendingInvoiceFile = {
    name: file.name,
    type: file.type,
    data: await readFileAsDataUrl(file),
  };

  applyInvoiceDraft(extractInvoiceDraft(file.name));
}

function applyInvoiceDraft(draft) {
  if (draft.vendor && !elements.invoiceVendor.value) {
    elements.invoiceVendor.value = draft.vendor;
  }
  if (draft.invoiceNumber && !elements.invoiceNumber.value) {
    elements.invoiceNumber.value = draft.invoiceNumber;
  }
  if (draft.date && !elements.invoiceDate.value) {
    elements.invoiceDate.value = draft.date;
  }
  if (draft.month && !elements.invoiceMonth.value) {
    elements.invoiceMonth.value = draft.month;
  }
  if (draft.amount && !elements.invoiceAmount.value) {
    elements.invoiceAmount.value = formatInputAmount(draft.amount);
  }

  elements.invoiceNote.value =
    "Prélecture OCR locale à valider : le navigateur a prérempli ce qu'il peut depuis le nom du fichier. Une vraie couche OCR pourra remplacer cette fonction ensuite.";
}

function addInvoice() {
  const projectId = selectedProjectId();
  const date = elements.invoiceDate.value;
  const invoice = {
    id: createId(),
    projectId,
    lotId: elements.invoiceLot.value,
    categoryId: elements.invoiceCategory.value,
    lineId: elements.invoiceLine.value,
    vendor: elements.invoiceVendor.value.trim(),
    date,
    month: elements.invoiceMonth.value || date.slice(0, 7),
    amount: toAmount(elements.invoiceAmount.value),
    vat: toAmount(elements.invoiceVat.value),
    invoiceNumber: elements.invoiceNumber.value.trim(),
    status: elements.invoiceStatus.value,
    fileName: pendingInvoiceFile?.name || "Saisie manuelle",
    fileType: pendingInvoiceFile?.type || "",
    fileData: pendingInvoiceFile?.data || "",
    note: elements.invoiceNote.value.trim(),
  };

  if (!invoice.vendor || !invoice.date || !invoice.month || !invoice.categoryId || !invoice.lineId || invoice.amount <= 0) {
    return;
  }

  state.invoices.push(invoice);
  saveState();
  pendingInvoiceFile = null;
  elements.invoiceForm.reset();
  elements.invoiceDate.value = new Date().toISOString().slice(0, 10);
  elements.invoiceMonth.value = selectedMonth();
  elements.invoiceStatus.value = "À valider";
  updateLotOptions();
  updateInvoiceLineOptions();
  render();
}

function validateInvoice(invoiceId) {
  const invoice = state.invoices.find((item) => item.id === invoiceId);
  if (!invoice) {
    return;
  }

  invoice.status = "Validée";
  saveState();
  render();
}

function deleteInvoice(invoiceId) {
  state.invoices = state.invoices.filter((invoice) => invoice.id !== invoiceId);
  saveState();
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
  renderMonthlyMetrics(project.id, month);
  renderGlobalMetrics(project.id);
  renderLots(project.id);
  renderBudgetTable(project.id, month, options);
  renderExpenseTable(project.id, month);
  renderInvoiceTable(project.id);
  renderAlerts(project.id, month);
  renderCharts();
}

function renderProjectActions(project) {
  elements.archiveProjectBtn.textContent = project.archived ? "Restaurer" : "Archiver";
  elements.archiveProjectBtn.disabled = !project.archived && activeProjects().length <= 1;
  elements.deleteProjectBtn.disabled = state.projects.length <= 1;
}

function renderMonthlyMetrics(projectId, month) {
  const planned = plannedTotal(projectId, month);
  const actual = actualTotal(projectId, month);
  const variance = actual - planned;
  const usage = planned > 0 ? (actual / planned) * 100 : actual > 0 ? 100 : 0;

  elements.plannedTotal.textContent = formatCurrency(planned);
  elements.actualTotal.textContent = formatCurrency(actual);
  elements.varianceTotal.textContent = formatSignedCurrency(variance);
  elements.usageRate.textContent = `${percentFormatter.format(usage)} %`;

  updateMetricTone(elements.varianceTotal.closest(".metric-card"), variance, true);
  updateMetricTone(elements.usageRate.closest(".metric-card"), usage - 100, true);
}

function renderGlobalMetrics(projectId) {
  const planned = globalPlannedTotal(projectId);
  const actual = globalActualTotal(projectId);
  const variance = actual - planned;
  const remaining = planned - actual;
  const usage = planned > 0 ? (actual / planned) * 100 : actual > 0 ? 100 : 0;

  elements.globalPlannedTotal.textContent = formatCurrency(planned);
  elements.globalActualTotal.textContent = formatCurrency(actual);
  elements.globalVarianceTotal.textContent = formatSignedCurrency(variance);
  elements.globalRemainingTotal.textContent = formatCurrency(remaining);
  elements.globalUsageRate.textContent = `${percentFormatter.format(usage)} %`;

  updateMetricTone(elements.globalVarianceTotal.closest(".metric-card"), variance, true);
  updateMetricTone(elements.globalRemainingTotal.closest(".metric-card"), remaining, false);
  updateMetricTone(elements.globalUsageRate.closest(".metric-card"), usage - 100, true);
}

function updateMetricTone(card, value, positiveIsBad) {
  card.classList.toggle("negative", positiveIsBad ? value > 0 : value < 0);
  card.classList.toggle("positive", positiveIsBad ? value < 0 : value > 0);
  card.classList.toggle("warning", value === 0);
}

function renderLots(projectId) {
  const lots = lotsForProject(projectId);
  if (lots.length === 0) {
    elements.lotTableBody.innerHTML = `
      <tr>
        <td class="muted-row" colspan="6">Aucun lot créé pour ce projet.</td>
      </tr>
    `;
    return;
  }

  elements.lotTableBody.innerHTML = lots
    .map((lot) => {
      const actual = actualByLot(projectId, lot.id);
      const usage = lot.budget > 0 ? (actual / lot.budget) * 100 : actual > 0 ? 100 : 0;
      const statusClass = usage > 100 ? "bad" : usage >= 80 ? "watch" : "good";
      return `
        <tr>
          <td>
            <strong>${escapeHtml(lot.name)}</strong>
            <span class="table-subtext">${escapeHtml(dateRangeLabel(lot.startDate, lot.endDate))}</span>
          </td>
          <td><span class="status-pill">${escapeHtml(lot.status)}</span></td>
          <td>${formatCurrency(lot.budget)}</td>
          <td>${formatCurrency(actual)}</td>
          <td><span class="status-pill ${statusClass}">${percentFormatter.format(usage)} %</span></td>
          <td>
            <button class="link-button danger" type="button" data-delete-lot="${lot.id}">
              Supprimer
            </button>
          </td>
        </tr>
      `;
    })
    .join("");
}

function renderBudgetTable(projectId, month, options = {}) {
  elements.budgetTableBody.innerHTML = categories.map((category) => renderCategoryRows(projectId, month, category)).join("");

  if (options.keepBudgetFocus) {
    const focusedInput = elements.budgetTableBody.querySelector(
      `[data-budget-input][data-line-id="${options.keepBudgetFocus}"]`,
    );
    if (focusedInput) {
      focusedInput.focus();
      const length = focusedInput.value.length;
      try {
        focusedInput.setSelectionRange(length, length);
      } catch {
        // Some input modes do not expose selection APIs.
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
      <td>Tous les lots</td>
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
        <select class="lot-select" data-line-lot-select data-line-id="${line.id}" aria-label="Lot pour ${escapeHtml(line.label)}">
          ${lotOptionsHtml(projectId, line.lotId)}
        </select>
      </td>
      <td>
        <input
          class="money-input"
          type="text"
          inputmode="decimal"
          value="${formatInputAmount(budget)}"
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

function renderExpenseTable(projectId, month) {
  const expenses = expensesForProjectMonth(projectId, month).sort((a, b) => b.date.localeCompare(a.date));

  if (expenses.length === 0) {
    elements.expenseTableBody.innerHTML = `
      <tr>
        <td class="muted-row" colspan="6">Aucune dépense manuelle sur ce projet pour ce mois.</td>
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

function renderInvoiceTable(projectId) {
  const invoices = invoicesForProject(projectId).sort((a, b) => b.date.localeCompare(a.date));
  if (invoices.length === 0) {
    elements.invoiceTableBody.innerHTML = `
      <tr>
        <td class="muted-row" colspan="6">Aucune facture importée sur ce projet.</td>
      </tr>
    `;
    return;
  }

  elements.invoiceTableBody.innerHTML = invoices
    .map((invoice) => {
      const lot = lotById(projectId, invoice.lotId);
      const fileLink = invoice.fileData
        ? `<a class="file-link" href="${invoice.fileData}" download="${escapeHtml(invoice.fileName)}">${escapeHtml(invoice.fileName || "Fichier")}</a>`
        : escapeHtml(invoice.fileName || "Saisie manuelle");
      return `
        <tr>
          <td>
            <strong>${escapeHtml(invoice.invoiceNumber || "Sans numéro")}</strong>
            <span class="table-subtext">${fileLink}</span>
          </td>
          <td>${escapeHtml(invoice.vendor)}</td>
          <td>${escapeHtml(lot?.name || "Aucun lot")}</td>
          <td>${formatCurrency(invoice.amount)}</td>
          <td><span class="status-pill ${invoice.status === "Validée" ? "good" : "watch"}">${escapeHtml(invoice.status)}</span></td>
          <td class="line-actions">
            ${
              invoice.status !== "Validée"
                ? `<button class="link-button" type="button" data-validate-invoice="${invoice.id}">Valider</button>`
                : ""
            }
            <button class="link-button danger" type="button" data-delete-invoice="${invoice.id}">Supprimer</button>
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
  const pendingInvoices = invoicesForProject(projectId).filter((invoice) => invoice.status !== "Validée");
  const lotAlerts = lotsForProject(projectId)
    .map((lot) => ({ lot, actual: actualByLot(projectId, lot.id) }))
    .filter((row) => row.lot.budget > 0 && row.actual > row.lot.budget);

  const alerts = [
    ...rows
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
      .filter(Boolean),
    ...pendingInvoices.map((invoice) => ({
      type: "warning",
      title: `Facture à valider : ${invoice.vendor}`,
      body: `${formatCurrency(invoice.amount)} ne compte pas encore dans le réel tant que la facture n'est pas validée.`,
    })),
    ...lotAlerts.map((row) => ({
      type: "danger",
      title: `Lot en dépassement : ${row.lot.name}`,
      body: `${formatSignedCurrency(row.actual - row.lot.budget)} vs budget du lot.`,
    })),
  ];

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
    .slice(0, 10)
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
  drawMonthlyComparisonChart(projectId, month);
  drawCategoryChart(projectId, month);
  drawTrendChart(projectId, month);
  drawVendorChart(projectId);
  drawLotChart(projectId);
}

function drawMonthlyComparisonChart(projectId, month) {
  const months = monthsForProject(projectId, month);
  const rows = months.map((item) => ({
    label: monthLabel(item),
    budget: plannedTotal(projectId, item),
    actual: actualTotal(projectId, item),
  }));
  drawVerticalComparison(elements.monthlyComparisonChart, rows, {
    budgetLabel: "Prévu",
    actualLabel: "Réel",
    title: "Prévu vs réel mensuel",
  });
}

function drawCategoryChart(projectId, month) {
  const rows = categories.map((category) => ({
    label: category.label,
    budget: plannedByCategory(projectId, month, category.id),
    actual: actualByCategory(projectId, month, category.id),
    color: category.color,
  }));
  drawHorizontalComparison(elements.categoryChart, rows, "Budget", "Réel");
}

function drawTrendChart(projectId, month) {
  const months = Array.from({ length: 6 }, (_, index) => addMonths(month, index - 5));
  const rows = months.map((item) => ({
    label: monthLabel(item),
    budget: plannedTotal(projectId, item),
    actual: actualTotal(projectId, item),
  }));
  drawVerticalComparison(elements.trendChart, rows, { budgetLabel: "Budget", actualLabel: "Réel" });
}

function drawVendorChart(projectId) {
  const rows = topVendorRows(projectId).map((row, index) => ({
    label: row.vendor,
    budget: 0,
    actual: row.amount,
    color: palette(index),
  }));
  drawSingleHorizontalBars(elements.vendorChart, rows, "Réel");
}

function drawLotChart(projectId) {
  const rows = lotsForProject(projectId).map((lot, index) => ({
    label: lot.name,
    budget: lot.budget,
    actual: actualByLot(projectId, lot.id),
    color: palette(index),
  }));
  drawHorizontalComparison(elements.lotChart, rows, "Budget lot", "Réel");
}

function drawVerticalComparison(canvas, rows, labels = {}) {
  const { context, width, height } = setupCanvas(canvas);
  if (!rows.length) {
    drawEmptyChart(context, width, height);
    return;
  }

  const maxValue = Math.max(1, ...rows.flatMap((row) => [row.budget, row.actual]));
  const padding = { top: 26, right: 18, bottom: 46, left: 54 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;
  const groupWidth = chartWidth / rows.length;
  const barWidth = Math.min(30, Math.max(12, groupWidth / 4));
  const baseY = padding.top + chartHeight;

  drawGrid(context, padding.left, padding.top, chartWidth, chartHeight);

  rows.forEach((row, index) => {
    const x = padding.left + index * groupWidth + groupWidth / 2;
    const budgetHeight = (row.budget / maxValue) * chartHeight;
    const actualHeight = (row.actual / maxValue) * chartHeight;

    roundedRect(context, x - barWidth - 3, baseY - budgetHeight, barWidth, budgetHeight, 5, "#94a3b8");
    roundedRect(context, x + 3, baseY - actualHeight, barWidth, actualHeight, 5, "#2563eb");

    context.fillStyle = "#667085";
    context.font = "12px Inter, system-ui, sans-serif";
    context.textAlign = "center";
    context.fillText(row.label, x, height - 18);
  });

  context.textAlign = "left";
  drawLegend(context, width, height, [
    { label: labels.budgetLabel || "Budget", color: "#94a3b8" },
    { label: labels.actualLabel || "Réel", color: "#2563eb" },
  ]);
}

function drawHorizontalComparison(canvas, rows, budgetLabel, actualLabel) {
  const { context, width, height } = setupCanvas(canvas);
  const visibleRows = rows.filter((row) => row.budget > 0 || row.actual > 0).slice(0, 10);
  if (!visibleRows.length) {
    drawEmptyChart(context, width, height);
    return;
  }

  const maxValue = Math.max(1, ...visibleRows.flatMap((row) => [row.budget, row.actual]));
  const left = width < 560 ? 118 : 180;
  const right = 24;
  const rowHeight = Math.max(28, (height - 34) / visibleRows.length);
  const barMaxWidth = Math.max(80, width - left - right);

  context.font = "12px Inter, system-ui, sans-serif";
  context.textBaseline = "middle";

  visibleRows.forEach((row, index) => {
    const y = 18 + index * rowHeight;
    const budgetWidth = (row.budget / maxValue) * barMaxWidth;
    const actualWidth = (row.actual / maxValue) * barMaxWidth;

    context.fillStyle = "#475467";
    context.fillText(truncateText(context, row.label, left - 18), 0, y + 10);

    roundedRect(context, left, y, barMaxWidth, 10, 5, "#edf2f7");
    roundedRect(context, left, y, budgetWidth, 10, 5, "#94a3b8");
    roundedRect(context, left, y + 15, barMaxWidth, 10, 5, "#edf2f7");
    roundedRect(context, left, y + 15, actualWidth, 10, 5, row.color || "#2563eb");
  });

  drawLegend(context, width, height, [
    { label: budgetLabel, color: "#94a3b8" },
    { label: actualLabel, color: "#2563eb" },
  ]);
}

function drawSingleHorizontalBars(canvas, rows, label) {
  const { context, width, height } = setupCanvas(canvas);
  const visibleRows = rows.filter((row) => row.actual > 0).slice(0, 10);
  if (!visibleRows.length) {
    drawEmptyChart(context, width, height);
    return;
  }

  const maxValue = Math.max(1, ...visibleRows.map((row) => row.actual));
  const left = width < 560 ? 118 : 180;
  const right = 24;
  const rowHeight = Math.max(28, (height - 34) / visibleRows.length);
  const barMaxWidth = Math.max(80, width - left - right);

  context.font = "12px Inter, system-ui, sans-serif";
  context.textBaseline = "middle";

  visibleRows.forEach((row, index) => {
    const y = 18 + index * rowHeight;
    const barWidth = (row.actual / maxValue) * barMaxWidth;

    context.fillStyle = "#475467";
    context.fillText(truncateText(context, row.label, left - 18), 0, y + 8);
    roundedRect(context, left, y, barMaxWidth, 14, 7, "#edf2f7");
    roundedRect(context, left, y, barWidth, 14, 7, row.color || "#2563eb");
  });

  drawLegend(context, width, height, [{ label, color: "#2563eb" }]);
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

function drawGrid(context, left, top, width, height) {
  context.strokeStyle = "#e6edf4";
  context.lineWidth = 1;
  for (let index = 0; index <= 4; index += 1) {
    const y = top + (height / 4) * index;
    context.beginPath();
    context.moveTo(left, y);
    context.lineTo(left + width, y);
    context.stroke();
  }
}

function drawEmptyChart(context, width, height) {
  context.fillStyle = "#667085";
  context.font = "14px Inter, system-ui, sans-serif";
  context.textAlign = "center";
  context.fillText("Aucune donnée à afficher", width / 2, height / 2);
  context.textAlign = "left";
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
  const itemWidth = 92;
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
    [
      "Type",
      "Projet",
      "Lot",
      "Mois",
      "Date",
      "Catégorie",
      "Ligne",
      "Prestataire",
      "Budget prévu",
      "Réel",
      "TVA",
      "Statut",
      "Note",
    ],
  ];

  budgetLinesForProject(project.id).forEach((line) => {
    const category = categoryById(line.categoryId) || categories[categories.length - 1];
    const lot = lotById(project.id, line.lotId);
    rows.push([
      "Budget",
      project.label,
      lot?.name || "",
      month,
      "",
      category.label,
      line.label,
      "",
      getBudget(project.id, month, line.id),
      "",
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
      lotById(project.id, expense.lotId)?.name || "",
      expense.month,
      expense.date,
      categoryById(expense.categoryId)?.label || "Divers",
      line?.label || "Ligne supprimée",
      expense.vendor,
      "",
      expense.amount,
      "",
      expense.recurrence,
      expense.note,
    ]);
  });

  invoicesForProject(project.id).forEach((invoice) => {
    const line = budgetLineById(project.id, invoice.lineId);
    rows.push([
      "Facture",
      project.label,
      lotById(project.id, invoice.lotId)?.name || "",
      invoice.month,
      invoice.date,
      categoryById(invoice.categoryId)?.label || "Divers",
      line?.label || "Ligne supprimée",
      invoice.vendor,
      "",
      invoice.amount,
      invoice.vat,
      invoice.status,
      invoice.note,
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

function lotsForProject(projectId) {
  if (!state.lots[projectId]) {
    state.lots[projectId] = [];
  }
  return state.lots[projectId];
}

function lotById(projectId, lotId) {
  if (!lotId) {
    return null;
  }
  return lotsForProject(projectId).find((lot) => lot.id === lotId) || null;
}

function ensureAllProjectLots(sourceState) {
  sourceState.projects.forEach((project) => {
    if (!sourceState.lots[project.id]) {
      sourceState.lots[project.id] = [];
    }
  });
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

function ensureLine(sourceState, projectId, line) {
  if (!sourceState.budgetLines[projectId]) {
    sourceState.budgetLines[projectId] = [];
  }

  const exists = sourceState.budgetLines[projectId].some((item) => item.id === line.id);
  if (!exists) {
    sourceState.budgetLines[projectId].push({ lotId: NO_LOT, ...line });
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

function expensesForProject(projectId) {
  return state.expenses.filter((expense) => expense.projectId === projectId);
}

function expensesForProjectMonth(projectId, month) {
  return expensesForProject(projectId).filter((expense) => expense.month === month);
}

function invoicesForProject(projectId) {
  return state.invoices.filter((invoice) => invoice.projectId === projectId);
}

function validatedInvoicesForProject(projectId) {
  return invoicesForProject(projectId).filter((invoice) => invoice.status === "Validée");
}

function actualRecordsForProject(projectId) {
  return [
    ...expensesForProject(projectId).map((expense) => ({ ...expense, source: "Dépense" })),
    ...validatedInvoicesForProject(projectId).map((invoice) => ({ ...invoice, source: "Facture" })),
  ];
}

function actualRecordsForProjectMonth(projectId, month) {
  return actualRecordsForProject(projectId).filter((record) => record.month === month);
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

function plannedTotal(projectId, month) {
  return sum(budgetLinesForProject(projectId).map((line) => getBudget(projectId, month, line.id)));
}

function plannedByCategory(projectId, month, categoryId) {
  return sum(budgetLinesForCategory(projectId, categoryId).map((line) => getBudget(projectId, month, line.id)));
}

function plannedByLot(projectId, month, lotId) {
  return sum(
    budgetLinesForProject(projectId)
      .filter((line) => line.lotId === lotId)
      .map((line) => getBudget(projectId, month, line.id)),
  );
}

function actualTotal(projectId, month) {
  return sum(actualRecordsForProjectMonth(projectId, month).map((record) => toAmount(record.amount)));
}

function actualByCategory(projectId, month, categoryId) {
  return sum(
    actualRecordsForProjectMonth(projectId, month)
      .filter((record) => record.categoryId === categoryId)
      .map((record) => toAmount(record.amount)),
  );
}

function actualByLine(projectId, month, lineId) {
  return sum(
    actualRecordsForProjectMonth(projectId, month)
      .filter((record) => record.lineId === lineId)
      .map((record) => toAmount(record.amount)),
  );
}

function actualByLot(projectId, lotId) {
  return sum(
    actualRecordsForProject(projectId)
      .filter((record) => record.lotId === lotId)
      .map((record) => toAmount(record.amount)),
  );
}

function globalLinePlannedTotal(projectId) {
  return sum(
    Object.values(state.budgets[projectId] || {}).flatMap((monthBudget) =>
      Object.values(monthBudget).map((amount) => toAmount(amount)),
    ),
  );
}

function globalLotBudgetTotal(projectId) {
  return sum(lotsForProject(projectId).map((lot) => toAmount(lot.budget)));
}

function globalPlannedTotal(projectId) {
  return Math.max(globalLinePlannedTotal(projectId), globalLotBudgetTotal(projectId));
}

function globalActualTotal(projectId) {
  return sum(actualRecordsForProject(projectId).map((record) => toAmount(record.amount)));
}

function topVendorRows(projectId) {
  const totals = new Map();
  actualRecordsForProject(projectId).forEach((record) => {
    const vendor = record.vendor || "Sans prestataire";
    totals.set(vendor, toAmount(totals.get(vendor)) + toAmount(record.amount));
  });
  return Array.from(totals, ([vendor, amount]) => ({ vendor, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);
}

function monthsForProject(projectId, fallbackMonth) {
  const months = new Set();
  Object.keys(state.budgets[projectId] || {}).forEach((month) => months.add(month));
  actualRecordsForProject(projectId).forEach((record) => months.add(record.month));
  if (months.size === 0) {
    Array.from({ length: 6 }, (_, index) => addMonths(fallbackMonth, index - 5)).forEach((month) => months.add(month));
  }
  return Array.from(months).sort().slice(-12);
}

function lotHasData(projectId, lotId) {
  return (
    budgetLinesForProject(projectId).some((line) => line.lotId === lotId) ||
    state.expenses.some((expense) => expense.projectId === projectId && expense.lotId === lotId) ||
    state.invoices.some((invoice) => invoice.projectId === projectId && invoice.lotId === lotId)
  );
}

function budgetLineHasData(projectId, lineId) {
  const hasBudget = Object.values(state.budgets[projectId] || {}).some((monthBudget) => toAmount(monthBudget[lineId]) > 0);
  const hasExpense = state.expenses.some((expense) => expense.projectId === projectId && expense.lineId === lineId);
  const hasInvoice = state.invoices.some((invoice) => invoice.projectId === projectId && invoice.lineId === lineId);
  return hasBudget || hasExpense || hasInvoice;
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

function alignExpenseDateWithMonth() {
  const month = selectedMonth();
  if (!elements.expenseDate.value.startsWith(month)) {
    elements.expenseDate.value = `${month}-01`;
  }
  elements.invoiceMonth.value = month;
}

function lotOptionsHtml(projectId, selectedLotId) {
  return [
    `<option value="${NO_LOT}">Aucun lot</option>`,
    ...lotsForProject(projectId).map((lot) => {
      const selected = lot.id === selectedLotId ? "selected" : "";
      return `<option value="${lot.id}" ${selected}>${escapeHtml(lot.name)}</option>`;
    }),
  ].join("");
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function extractInvoiceDraft(fileName) {
  const clean = fileName.replace(/\.[^.]+$/, "").replace(/[_-]+/g, " ");
  const amountMatch = clean.match(/(?:^|\s)(\d{2,6}(?:[,.]\d{2})?)(?:\s?eur|\s?euro|\s?$)/i);
  const isoDate = clean.match(/\b(20\d{2})[-_. ](0[1-9]|1[0-2])[-_. ]([0-2]\d|3[01])\b/);
  const frenchDate = clean.match(/\b([0-2]\d|3[01])[-_. ](0[1-9]|1[0-2])[-_. ](20\d{2})\b/);
  const invoiceNumber = clean.match(/\b(?:fac|facture|invoice)[-_. ]?([a-z0-9-]+)\b/i);
  const date = isoDate ? `${isoDate[1]}-${isoDate[2]}-${isoDate[3]}` : frenchDate ? `${frenchDate[3]}-${frenchDate[2]}-${frenchDate[1]}` : "";
  const vendor = clean
    .replace(/\b(?:fac|facture|invoice)[-_. ]?[a-z0-9-]+\b/i, "")
    .replace(/\b\d{2,6}(?:[,.]\d{2})?\b/g, "")
    .replace(/\b20\d{2}\b/g, "")
    .trim()
    .split(" ")
    .slice(0, 3)
    .join(" ");

  return {
    vendor,
    invoiceNumber: invoiceNumber?.[1] || "",
    date,
    month: date ? date.slice(0, 7) : "",
    amount: amountMatch ? toAmount(amountMatch[1]) : 0,
  };
}

function normalizeLotId(sourceState, projectId, lotId) {
  if (!lotId) {
    return NO_LOT;
  }
  return sourceState.lots[projectId]?.some((lot) => lot.id === lotId) ? lotId : NO_LOT;
}

function normalizeLotStatus(status) {
  return ["Prévu", "En cours", "Terminé", "En pause"].includes(status) ? status : "Prévu";
}

function normalizeDate(value) {
  const text = String(value || "");
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : "";
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

  const lineId = sanitizeId(budgetKey);
  ensureLine(sourceState, projectId, { id: lineId, categoryId: "divers", label: String(budgetKey) });
  return lineId;
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

function looksLikeLegacyBudgets(budgets) {
  return Object.keys(budgets).some((key) => /^\d{4}-\d{2}$/.test(key));
}

function currentMonth() {
  const now = new Date();
  const month = `${now.getMonth() + 1}`.padStart(2, "0");
  return `${now.getFullYear()}-${month}`;
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

function dateRangeLabel(startDate, endDate) {
  if (!startDate && !endDate) {
    return "Dates non renseignées";
  }
  return `${startDate ? formatDate(startDate) : "Début ?"} - ${endDate ? formatDate(endDate) : "Fin ?"}`;
}

function toAmount(value) {
  const cleaned = String(value ?? "")
    .replace(/\s/g, "")
    .replace("€", "")
    .replace(",", ".")
    .replace(/[^0-9.-]/g, "");
  const amount = Number.parseFloat(cleaned);
  return Number.isFinite(amount) ? Math.max(amount, 0) : 0;
}

function formatInputAmount(amount) {
  const value = toAmount(amount);
  if (value === 0) {
    return "";
  }
  return Number.isInteger(value) ? String(value) : String(value.toFixed(2)).replace(".", ",");
}

function formatCurrency(amount) {
  return currencyFormatter.format(toAmount(amount));
}

function formatSignedCurrency(amount) {
  const value = Number(amount);
  if (value === 0) {
    return formatCurrency(0);
  }
  const sign = value > 0 ? "+" : "-";
  return `${sign}${formatCurrency(Math.abs(value))}`;
}

function sum(numbers) {
  return numbers.reduce((total, value) => total + toAmount(value), 0);
}

function palette(index) {
  return ["#2563eb", "#0f766e", "#7c3aed", "#f97316", "#db2777", "#16a34a", "#64748b", "#ca8a04"][index % 8];
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

function uniqueLotId(projectId, label) {
  const base = `lot-${sanitizeId(label) || "projet"}`;
  let candidate = base;
  let index = 2;
  while (lotsForProject(projectId).some((lot) => lot.id === candidate)) {
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
