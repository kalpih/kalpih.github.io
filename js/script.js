document.addEventListener('DOMContentLoaded', function () {

    // --- Reusable Collapsible Function ---
    function setupCollapsible(button, postToggleCallback) {
        const contentId = button.getAttribute('aria-controls');
        const content = document.getElementById(contentId);

        if (content) {
            const isInitiallyExpanded = button.classList.contains('active') || content.style.display === 'block';
            content.style.display = isInitiallyExpanded ? 'block' : 'none';
            button.classList.toggle('active', isInitiallyExpanded);
            button.setAttribute('aria-expanded', String(isInitiallyExpanded));

            button.addEventListener('click', function() {
                const isExpanded = this.classList.toggle('active');
                this.setAttribute('aria-expanded', String(isExpanded));
                content.style.display = isExpanded ? 'block' : 'none';

                if (this.classList.contains('collapsible') && this.nextElementSibling && this.nextElementSibling.classList.contains('book-details-box')) {
                    this.classList.toggle('followed-by-details-box', isExpanded);
                }
                this.blur();

                if (postToggleCallback) {
                    postToggleCallback();
                }
            });

            if (isInitiallyExpanded && button.classList.contains('collapsible') && button.nextElementSibling && button.nextElementSibling.classList.contains('book-details-box')) {
                button.classList.add('followed-by-details-box');
            }
        }
    }

    // --- Reusable Update Toggle All Button Text Function ---
    // MODIFIED: To implement "majority need" logic for text
    function updateToggleAllButtonText(toggleButton, collapsibleButtons) {
        if (!toggleButton) return;

        // Filter for buttons that are part of currently visible sections/entries
        const visibleControllableButtons = collapsibleButtons.filter(btn => {
            const parentSection = btn.closest('section'); // For Articles page structure
            const parentEntry = btn.closest('.entry > div'); // For Bio/Projects (assuming collapsibles are in divs within .entry) or Books page structure
            let parentContainer = parentSection || parentEntry;
            // If no direct section or div parent, check the book-entry class if it's a book page detail
            if (!parentContainer && btn.closest('.book-entry')) {
                parentContainer = btn.closest('.book-entry');
            }
            return !parentContainer || parentContainer.style.display !== 'none';
        });

        if (visibleControllableButtons.length === 0) {
            toggleButton.textContent = 'Expand all'; // Default if no relevant items
            toggleButton.style.display = 'none'; // Hide if nothing to control
            return;
        }
        toggleButton.style.display = ''; // Ensure button is visible

        const numRelevant = visibleControllableButtons.length;
        const numExpanded = visibleControllableButtons.filter(btn => btn.classList.contains('active')).length;

        if (numExpanded > numRelevant / 2) {
            // More than half are expanded
            toggleButton.textContent = 'Collapse all';
        } else {
            // Half or fewer are expanded (majority are collapsed, or 50/50 split)
            toggleButton.textContent = 'Expand all';
        }
    }

    // --- Reusable Toggle All Collapsibles Function ---
    // This function's core logic remains the same; it acts based on the button's current text
    function setupToggleAllButton(toggleButton, collapsibleButtons) {
        if (toggleButton && collapsibleButtons && collapsibleButtons.length > 0) {
            updateToggleAllButtonText(toggleButton, collapsibleButtons); // Initial text set by new logic
            toggleButton.addEventListener('click', () => {
                const shouldExpand = toggleButton.textContent.toLowerCase().startsWith('expand');
                // Filter for buttons that are part of currently visible sections/entries
                const visibleControllableButtonsOnClick = collapsibleButtons.filter(btn => {
                    const parentSection = btn.closest('section');
                    const parentEntry = btn.closest('.entry > div');
                    let parentContainer = parentSection || parentEntry;
                    if (!parentContainer && btn.closest('.book-entry')) {
                        parentContainer = btn.closest('.book-entry');
                    }
                    return !parentContainer || parentContainer.style.display !== 'none';
                });

                if (visibleControllableButtonsOnClick.length === 0) return;

                visibleControllableButtonsOnClick.forEach(btn => {
                    const isCurrentlyExpanded = btn.classList.contains('active');
                    if ((shouldExpand && !isCurrentlyExpanded) || (!shouldExpand && isCurrentlyExpanded)) {
                        btn.click(); // This will also trigger postToggleCallback if one was set by setupCollapsible
                    }
                });
                // The text might have already been updated by the last btn.click() if callbacks are fast.
                // But an explicit update here ensures consistency after all actions.
                updateToggleAllButtonText(toggleButton, collapsibleButtons);
            });
        } else {
            if (toggleButton) {
                updateToggleAllButtonText(toggleButton, []); // Handle case with no collapsibles
            }
        }
    }

    // --- Setup for Index Page (Bio) ---
    function setupIndexPageLogic() {
        const pageElement = document.getElementById('page-bio');
        if (!pageElement) return;
        const toggleAllBioBtn = pageElement.querySelector('#toggle-all'); // Assuming '#toggle-all' is the ID on Bio page
        const pageCollapsibles = Array.from(pageElement.querySelectorAll('.entry .collapsible'));

        // MODIFIED: Add callback to update global button text
        pageCollapsibles.forEach(btn => {
            setupCollapsible(btn, () => {
                if (toggleAllBioBtn) { // Check if the global button exists
                    updateToggleAllButtonText(toggleAllBioBtn, pageCollapsibles);
                }
            });
        });

        if (toggleAllBioBtn) {
            setupToggleAllButton(toggleAllBioBtn, pageCollapsibles);
        }
    }

    // --- Setup for Articles Page ---
    function setupArticlesPageLogic() {
        const pageElement = document.getElementById('page-articles');
        if (!pageElement) return;

        const yearSectionCollapsibles = Array.from(pageElement.querySelectorAll('.entry > section > .collapsible'));
        const toggleAllArticlesBtn = pageElement.querySelector('#toggle-all'); // Assuming '#toggle-all' is the ID
        // ... (rest of your Articles page variables from your original script) ...
        const langFilterButtons = pageElement.querySelectorAll('.language-filter-controls button[data-filter-lang]');
        const statusFilterButtons = pageElement.querySelectorAll('.status-filter-controls button[data-filter-status]');
        const allArticleItemsContainer = pageElement.querySelector('.entry');
        const potentialItems = allArticleItemsContainer ? Array.from(allArticleItemsContainer.querySelectorAll('li[data-lang][data-status]')) : [];
        const articleLookup = new Map();
        const articleGroups = new Map();
        let currentLangFilter = 'all';
        let currentStatusFilter = 'all';

        potentialItems.forEach(item => {
            const id = item.id; if (!id) { return; }
            const lang = item.dataset.lang || '??';
            const primaryRefId = item.dataset.primaryRef;
            const titleElement = item.querySelector('a'); let title = "Article";
            if (titleElement && titleElement.textContent) { title = titleElement.textContent.trim().replace(/["“”]/g, ''); if (title.length > 50) title = title.substring(0, 47) + "..."; }
            const numberSpan = item.querySelector('.article-number'); const originalNumber = numberSpan?.textContent?.trim() || '';
            const articleData = { id, lang, title, primaryRefId, isSecondary: !!primaryRefId, element: item, originalNumber: originalNumber };
            articleLookup.set(id, articleData); const groupId = primaryRefId || id;
            if (!articleGroups.has(groupId)) { articleGroups.set(groupId, new Set()); } articleGroups.get(groupId).add(id);
            if (primaryRefId && articleLookup.has(primaryRefId)) { if (!articleGroups.has(primaryRefId)) { articleGroups.set(primaryRefId, new Set()); } articleGroups.get(primaryRefId).add(id); articleGroups.get(primaryRefId).add(primaryRefId); }
        });
        articleLookup.forEach(articleData => { if(articleData.isSecondary) { const primaryId = articleData.primaryRefId; if(articleGroups.has(primaryId) && articleLookup.has(primaryId)) { articleGroups.get(primaryId).add(articleData.id); articleGroups.get(primaryId).add(primaryId); } } });

        function injectRelatedArticleLinks() {
            articleLookup.forEach(currentArticleData => {
                const currentId = currentArticleData.id;
                const liElement = currentArticleData.element;
                let linksContainer = liElement.querySelector('.related-article-links');
                if (!linksContainer) { linksContainer = document.createElement('span'); linksContainer.className = 'related-article-links'; liElement.appendChild(linksContainer); }
                linksContainer.innerHTML = '';
                if (liElement.style.display === 'none') { return; }
                const groupId = currentArticleData.isSecondary ? currentArticleData.primaryRefId : currentId;
                const relatedIdsInGroup = articleGroups.get(groupId);
                if (relatedIdsInGroup && relatedIdsInGroup.size > 1) {
                    const allIdsInGroup = Array.from(relatedIdsInGroup);
                    let linksHtml = [];
                    let prefixHTML = '&nbsp;<span class="related-links-prefix">(Also:</span> ';
                    let suffixHTML = '<span class="related-links-suffix">)</span>';
                    let specialCaseHandled = false;
                    if (allIdsInGroup.length === 2) {
                        const otherId = allIdsInGroup.find(id => id !== currentId);
                        const otherArticleData = articleLookup.get(otherId);
                        if (otherArticleData) {
                            const currentPrimaryLang = currentArticleData.lang.split(' ')[0]; const otherPrimaryLang = otherArticleData.lang.split(' ')[0];
                            if (currentPrimaryLang === otherPrimaryLang) {
                                specialCaseHandled = true;
                                const currentOriginalNumStr = currentArticleData.originalNumber.replace('.', '') || '0'; const otherOriginalNumStr = otherArticleData.originalNumber.replace('.', '') || '0';
                                const currentOriginalNum = parseInt(currentOriginalNumStr, 10) || 0; const otherOriginalNum = parseInt(otherOriginalNumStr, 10) || 0;
                                let linkText = ''; let prefixTextForSpanContent = '';
                                if (currentOriginalNum === 0 || otherOriginalNum === 0) { specialCaseHandled = false; }
                                else if (currentOriginalNum < otherOriginalNum) { prefixTextForSpanContent = '(Also:'; linkText = 'Republished'; suffixHTML = '<span class="related-links-suffix">)</span>'; }
                                else { prefixTextForSpanContent = '(Republished.'; linkText = 'Original'; suffixHTML = '<span class="related-links-suffix">)</span>'; }
                                if (specialCaseHandled && linkText) { prefixHTML = `&nbsp;<span class="related-links-prefix">${prefixTextForSpanContent}</span> `; linksHtml.push(`<a href="#${otherArticleData.id}" class="related-link" title="View ${linkText.toLowerCase()} version: ${otherArticleData.title} (${otherArticleData.lang})">${linkText}</a>`); }
                                else { specialCaseHandled = false; }
                            }
                        }
                    }
                    if (!specialCaseHandled) {
                        prefixHTML = '&nbsp;<span class="related-links-prefix">(Also:</span> ';
                        suffixHTML = '<span class="related-links-suffix">)</span>';
                        allIdsInGroup.forEach(relatedId => {
                            if (relatedId !== currentId) {
                                const relatedArticleData = articleLookup.get(relatedId);
                                if (relatedArticleData) { const langText = relatedArticleData.lang.split(' ')[0].toUpperCase(); linksHtml.push(`<a href="#${relatedArticleData.id}" class="related-link" title="View version: ${relatedArticleData.title} (${relatedArticleData.lang})">${langText}</a>`); }
                            }
                        });
                    }
                    if (linksHtml.length > 0) { linksContainer.innerHTML = prefixHTML + linksHtml.join(' ') + suffixHTML; }
                    else { linksContainer.innerHTML = ''; }
                } else { linksContainer.innerHTML = ''; }
            });
        }

        function defaultScrollHighlight(targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
            document.querySelectorAll('li.highlighted-article').forEach(el => el.classList.remove('highlighted-article'));
            targetElement.classList.add('highlighted-article');
            setTimeout(() => { targetElement.classList.remove('highlighted-article'); }, 2500);
        }

        function resetFiltersIfNeeded(actionCallback) {
            let langFilterChanged = false;
            let statusFilterChanged = false;
            if (currentLangFilter !== 'all') {
                const allLangButton = Array.from(langFilterButtons).find(btn => btn.dataset.filterLang === 'all');
                if (allLangButton) { allLangButton.click(); langFilterChanged = true; }
            }
            if (currentStatusFilter !== 'all') {
                const allStatusButton = Array.from(statusFilterButtons).find(btn => btn.dataset.filterStatus === 'all');
                if (allStatusButton) { allStatusButton.click(); statusFilterChanged = true; }
            }
            if (langFilterChanged || statusFilterChanged) { setTimeout(actionCallback, 200); }
            else { actionCallback(); }
        }

        function handleRelatedLinkClick(e) {
            if (e.target.matches('a.related-link')) {
                e.preventDefault();
                const targetId = e.target.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    const actionAfterFilters = () => {
                        const collapsibleContentParent = targetElement.closest('.collapsible-content');
                        if (collapsibleContentParent && collapsibleContentParent.style.display === 'none') {
                            const buttonId = collapsibleContentParent.getAttribute('aria-labelledby');
                            const yearToggleButton = document.getElementById(buttonId);
                            if (yearToggleButton && !yearToggleButton.classList.contains('active')) {
                                yearToggleButton.click();
                                setTimeout(() => { defaultScrollHighlight(targetElement); }, 150);
                                return;
                            }
                        }
                        defaultScrollHighlight(targetElement);
                    };
                    resetFiltersIfNeeded(actionAfterFilters);
                }
            }
        }

        function renumberVisibleArticles() {
            if (!allArticleItemsContainer || potentialItems.length === 0) return; const allVisibleItems = [];
            potentialItems.forEach(item => { const numberSpan = item.querySelector('.article-number'); if (!numberSpan) return; const sectionContainer = item.closest('section'); const isSectionVisible = sectionContainer ? sectionContainer.style.display !== 'none' : true; const isItemIndividuallyVisible = item.style.display !== 'none'; const isVisible = isItemIndividuallyVisible && isSectionVisible; numberSpan.style.visibility = 'hidden'; if (isVisible) { const articleData = articleLookup.get(item.id); const originalNumberText = articleData ? articleData.originalNumber : (numberSpan.dataset.originalNumber || ""); allVisibleItems.push({ element: item, span: numberSpan, originalNumber: originalNumberText }); } });
            let currentDisplayNumber = 1; for (let i = allVisibleItems.length - 1; i >= 0; i--) { const itemData = allVisibleItems[i]; if (!itemData || !itemData.span) continue; const displayNumber = currentDisplayNumber; const originalText = itemData.originalNumber; let suffix = ''; const match = originalText.match(/[a-zA-Z]+(?=\.$)/); if (match) { suffix = match[0]; } itemData.span.textContent = displayNumber + suffix + "."; itemData.span.style.visibility = 'visible'; currentDisplayNumber++; }
        }


        function filterAndToggleYearSections() {
            if (potentialItems.length === 0 && yearSectionCollapsibles.length > 0) {
                yearSectionCollapsibles.forEach(button => { const sectionContainer = button.closest('section'); if (sectionContainer) sectionContainer.style.display = 'none'; });
                if (toggleAllArticlesBtn) { updateToggleAllButtonText(toggleAllArticlesBtn, []); }
                renumberVisibleArticles(); injectRelatedArticleLinks(); return;
            } else if (potentialItems.length === 0) {
                renumberVisibleArticles(); injectRelatedArticleLinks();
                if (toggleAllArticlesBtn) { updateToggleAllButtonText(toggleAllArticlesBtn, []); } return;
            }

            potentialItems.forEach(item => {
                const itemLangsArray = item.dataset.lang ? item.dataset.lang.split(' ') : [];
                const firstLang = itemLangsArray.length > 0 ? itemLangsArray[0].trim() : null;
                let langMatch = false;
                if (currentLangFilter === 'all') { langMatch = true; }
                else if (firstLang && firstLang === currentLangFilter) { langMatch = true; }
                const itemStatus = item.dataset.status || 'unknown';
                let statusMatch = false;
                if (currentStatusFilter === 'all') { statusMatch = true; }
                else if (currentStatusFilter === 'article') { statusMatch = (itemStatus === 'refereed-article' || itemStatus === 'non-refereed-article'); }
                else if (currentStatusFilter === 'chapter') { statusMatch = (itemStatus === 'refereed-chapter' || itemStatus === 'non-refereed-chapter'); }
                else if (currentStatusFilter === 'refereed') { statusMatch = (itemStatus === 'refereed-article' || itemStatus === 'refereed-chapter'); }
                else { statusMatch = (itemStatus === currentStatusFilter); }
                item.style.display = (langMatch && statusMatch) ? 'list-item' : 'none';
                item.classList.remove('article-item-needs-top-margin');
            });

            let controllableCollapsiblesForToggleAll = [];
            const yearSections = pageElement.querySelectorAll('.entry > section');
            yearSections.forEach(section => {
                const collapsibleButton = section.querySelector('button.collapsible');
                const contentDiv = section.querySelector('div.collapsible-content');
                let sectionShouldBeVisible = false;
                if (contentDiv) {
                    const list = contentDiv.querySelector('ul');
                    if (list) {
                        const visibleItemsInList = Array.from(list.children).filter(li => li.matches('li[data-lang][data-status]') && li.style.display !== 'none');
                        if (visibleItemsInList.length > 0) { sectionShouldBeVisible = true; }
                    }
                }
                section.style.display = sectionShouldBeVisible ? 'block' : 'none';
                if(sectionShouldBeVisible && collapsibleButton) { controllableCollapsiblesForToggleAll.push(collapsibleButton); }
            });

            const allYearULs = pageElement.querySelectorAll('.entry > section > .collapsible-content > ul');
            allYearULs.forEach(ul => {
                const parentSection = ul.closest('section');
                if (parentSection && parentSection.style.display === 'none') { return; }
                let firstVisibleChildInThisULFound = false;
                Array.from(ul.children).forEach(li => {
                    if (li.matches('li[data-lang][data-status]')) {
                        if (li.style.display !== 'none') {
                            if (firstVisibleChildInThisULFound) { li.classList.add('article-item-needs-top-margin'); }
                            firstVisibleChildInThisULFound = true;
                        }
                    }
                });
            });

            renumberVisibleArticles();
            injectRelatedArticleLinks();

            // Update button text based on currently controllable collapsibles after filtering
            if (toggleAllArticlesBtn) {
                updateToggleAllButtonText(toggleAllArticlesBtn, controllableCollapsiblesForToggleAll);
            }
        }

        if (langFilterButtons.length > 0) {
            langFilterButtons.forEach(button => {
                button.addEventListener('click', function() {
                    currentLangFilter = this.dataset.filterLang ? this.dataset.filterLang.trim() : 'all';
                    langFilterButtons.forEach(btn => btn.classList.remove('active-filter'));
                    this.classList.add('active-filter');
                    this.blur();
                    filterAndToggleYearSections();
                });
            });
        }
        if (statusFilterButtons.length > 0) {
            statusFilterButtons.forEach(button => {
                button.addEventListener('click', function() {
                    currentStatusFilter = this.dataset.filterStatus;
                    statusFilterButtons.forEach(btn => btn.classList.remove('active-filter'));
                    this.classList.add('active-filter');
                    this.blur();
                    filterAndToggleYearSections();
                });
            });
        }

        // MODIFIED: Add callback for individual year section toggles
        yearSectionCollapsibles.forEach(btn => {
            setupCollapsible(btn, () => {
                if (toggleAllArticlesBtn) {
                    // When an individual year section is toggled, its content visibility changes,
                    // but the section itself (and thus its button) usually remains "controllable"
                    // unless a filter hides the entire section.
                    // The `filterAndToggleYearSections` function is the most robust way to get the
                    // current list of *truly* controllable buttons after any potential filtering.
                    // However, calling it fully might be overkill if it redoes too much.
                    // The generic updateToggleAllButtonText will re-filter for visibility anyway.
                    // We pass the original full list of yearSectionCollapsibles, and
                    // updateToggleAllButtonText will correctly determine visible ones.
                    updateToggleAllButtonText(toggleAllArticlesBtn, yearSectionCollapsibles);
                }
            });
        });

        if (toggleAllArticlesBtn) {
            // setupToggleAllButton will use the modified updateToggleAllButtonText
            setupToggleAllButton(toggleAllArticlesBtn, yearSectionCollapsibles);
        }

        if (allArticleItemsContainer) {
            allArticleItemsContainer.removeEventListener('click', handleRelatedLinkClick);
            allArticleItemsContainer.addEventListener('click', handleRelatedLinkClick);
        }

        const latestArticleLinks = pageElement.querySelectorAll('.latest-section-box .static-box-content ul li a');
        latestArticleLinks.forEach(link => {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                const targetId = this.getAttribute('href').substring(1);
                const targetElement = document.getElementById(targetId);
                if (targetElement) {
                    const actionAfterFilters = () => {
                        const collapsibleContentParent = targetElement.closest('.collapsible-content');
                        if (collapsibleContentParent && collapsibleContentParent.style.display === 'none') {
                            const buttonId = collapsibleContentParent.getAttribute('aria-labelledby');
                            const yearToggleButton = document.getElementById(buttonId);
                            if (yearToggleButton && !yearToggleButton.classList.contains('active')) {
                                yearToggleButton.click();
                                setTimeout(() => { defaultScrollHighlight(targetElement); }, 150);
                                return;
                            }
                        }
                        defaultScrollHighlight(targetElement);
                    };
                    resetFiltersIfNeeded(actionAfterFilters);
                }
            });
        });
        filterAndToggleYearSections(); // Initial setup and filtering
    } // --- End of setupArticlesPageLogic ---

    function setupBooksPageLogic() {
        const pageElement = document.getElementById('page-books');
        if (!pageElement) return;

        const toggleCoversBtn = pageElement.querySelector('#toggle-covers-button');
        const toggleDetailsBtn = pageElement.querySelector('#toggle-details-button');

        const allBookEntries = Array.from(pageElement.querySelectorAll('.entry > .book-entry'));
        const imageContainers = Array.from(pageElement.querySelectorAll('.image-collapsible-content'));
        const detailsCollapsibleBtns = Array.from(pageElement.querySelectorAll('.short_resume_content > button.collapsible'));

        const filterButtons = pageElement.querySelectorAll('.book-type-filter-controls button[data-filter-type]');
        let currentBookTypeFilter = 'all';

        allBookEntries.forEach(entry => {
            const numberSpan = entry.querySelector('.book-reference-text .entry-number');
            if (numberSpan && numberSpan.textContent) {
                numberSpan.dataset.originalNumber = numberSpan.textContent.trim();
            }
        });
        pageElement.querySelectorAll('.book-details-box[id^="target-translations-"] li .entry-number').forEach(span => {
            if (span.textContent) {
                span.dataset.originalNumber = span.textContent.trim();
            }
        });

        function getVisibleBookEntries() {
            return allBookEntries.filter(entry => entry.style.display !== 'none');
        }

        function getRelevantImageContainers() {
            const visibleEntries = getVisibleBookEntries();
            return imageContainers.filter(container => {
                const parentEntry = container.closest('.book-entry');
                return parentEntry && visibleEntries.includes(parentEntry);
            });
        }

        function getRelevantDetailsCollapsibleBtns() {
            const visibleEntries = getVisibleBookEntries();
            return detailsCollapsibleBtns.filter(btn => {
                const parentEntry = btn.closest('.book-entry');
                return parentEntry && visibleEntries.includes(parentEntry);
            });
        }

        let allCoversAreGloballyShown = false;

        function updateToggleCoversButtonText() {
            if (!toggleCoversBtn) return;
            const relevantContainers = getRelevantImageContainers();
            if (relevantContainers.length === 0) {
                toggleCoversBtn.textContent = 'Show Covers';
                return;
            }
            const allCurrentlyShown = relevantContainers.every(container => container.style.display === 'block');
            allCoversAreGloballyShown = allCurrentlyShown;
            toggleCoversBtn.textContent = allCoversAreGloballyShown ? 'Hide Covers' : 'Show Covers';
        }

        if (toggleCoversBtn) {
            toggleCoversBtn.addEventListener('click', () => {
                allCoversAreGloballyShown = !allCoversAreGloballyShown;
                const relevantContainers = getRelevantImageContainers();
                relevantContainers.forEach(container => {
                    container.style.display = allCoversAreGloballyShown ? 'block' : 'none';
                });
                toggleCoversBtn.textContent = allCoversAreGloballyShown ? 'Hide Covers' : 'Show Covers';
                toggleCoversBtn.blur();
            });
        }

        function updateToggleDetailsButtonText() { // This is the "majority need" version for Books page
            if (!toggleDetailsBtn) return;
            const relevantDetailBtns = getRelevantDetailsCollapsibleBtns();

            if (relevantDetailBtns.length === 0) {
                toggleDetailsBtn.textContent = 'Expand';
                return;
            }

            const numRelevant = relevantDetailBtns.length;
            const numExpanded = relevantDetailBtns.filter(btn => btn.classList.contains('active')).length;

            if (numExpanded > numRelevant / 2) {
                toggleDetailsBtn.textContent = 'Collapse';
            } else {
                toggleDetailsBtn.textContent = 'Expand';
            }
        }

        if (toggleDetailsBtn) {
            toggleDetailsBtn.addEventListener('click', () => {
                const relevantDetailBtns = getRelevantDetailsCollapsibleBtns();
                if (relevantDetailBtns.length === 0) return;

                const shouldExpand = toggleDetailsBtn.textContent === 'Expand';
                relevantDetailBtns.forEach(btn => {
                    const isCurrentlyExpanded = btn.classList.contains('active');
                    if ((shouldExpand && !isCurrentlyExpanded) || (!shouldExpand && isCurrentlyExpanded)) {
                        btn.click();
                    }
                });
                updateToggleDetailsButtonText();
                toggleDetailsBtn.blur();
            });
        }

        function numberVisibleBookEntries() {
            const visibleEntriesData = [];
            getVisibleBookEntries().forEach(entry => {
                const numberSpan = entry.querySelector('.book-reference-text .entry-number');
                if (!numberSpan) return;
                visibleEntriesData.push({ element: entry, span: numberSpan, originalNumber: numberSpan.dataset.originalNumber || "" });
                numberSpan.style.visibility = 'visible';
            });

            let currentNumber = 1;
            for (let i = visibleEntriesData.length - 1; i >= 0; i--) {
                const mainEntryData = visibleEntriesData[i];
                const mainNumberOnly = currentNumber;
                const originalMainText = mainEntryData.originalNumber;
                let mainSuffix = '';
                if (originalMainText) {
                    const match = originalMainText.match(/[a-zA-Z]+(?=\.$)/);
                    if (match) mainSuffix = match[0];
                }
                mainEntryData.span.textContent = mainNumberOnly + mainSuffix + ".";

                const translationSpans = mainEntryData.element.querySelectorAll('.book-details-box[id^="target-translations-"] li .entry-number');
                translationSpans.forEach(transSpan => {
                    const parentBookEntry = transSpan.closest('.book-entry');
                    if (parentBookEntry && parentBookEntry.style.display !== 'none') {
                        const originalTransText = transSpan.dataset.originalNumber || "";
                        let transSuffix = '';
                        if (originalTransText) {
                            const match = originalTransText.match(/[a-zA-Z]+(?=\.$)/);
                            if (match) transSuffix = match[0];
                        }
                        transSpan.textContent = mainNumberOnly + transSuffix + ".";
                        transSpan.style.visibility = 'visible';
                    } else {
                        transSpan.style.visibility = 'hidden';
                    }
                });
                currentNumber++;
            }
            allBookEntries.forEach(entry => {
                if (entry.style.display === 'none') {
                    const numberSpan = entry.querySelector('.book-reference-text .entry-number');
                    if (numberSpan) numberSpan.style.visibility = 'hidden';
                    entry.querySelectorAll('.book-details-box li .entry-number').forEach(subSpan => {
                        subSpan.style.visibility = 'hidden';
                    });
                }
            });
        }

        function filterBooksByType() {
            if (allBookEntries.length === 0) return;
            allBookEntries.forEach(entry => {
                const entryType = entry.dataset.bookType;
                const typeMatch = (currentBookTypeFilter === 'all' || entryType === currentBookTypeFilter);
                entry.style.display = typeMatch ? '' : 'none';
            });
            numberVisibleBookEntries();
            updateToggleCoversButtonText();
            updateToggleDetailsButtonText(); // This will use the "majority need" text logic for Books page
        }

        detailsCollapsibleBtns.forEach(btn => {
            setupCollapsible(btn, updateToggleDetailsButtonText); // For Books page details, specific text update
        });

        imageContainers.forEach(container => {
            container.style.display = 'none';
        });
        allCoversAreGloballyShown = false;

        updateToggleCoversButtonText();
        updateToggleDetailsButtonText(); // Initial text for Books page details button

        pageElement.querySelectorAll('.book-cover-placeholder img').forEach(img => {
            img.onerror = function() {
                const errorText = document.createElement('span');
                errorText.className = 'error-text';
                errorText.textContent = 'Cover not available';
                if (this.parentElement && !this.parentElement.querySelector('.error-text')) {
                    this.parentElement.appendChild(errorText);
                    this.style.display = 'none';
                }
            };
            if (img.complete && !img.naturalWidth && img.src) {
                img.onerror();
            }
        });

        if (filterButtons.length > 0) {
            filterButtons.forEach(button => {
                button.addEventListener('click', function() {
                    currentBookTypeFilter = this.dataset.filterType;
                    filterButtons.forEach(btn => btn.classList.remove('active-filter'));
                    this.classList.add('active-filter');
                    this.blur();
                    filterBooksByType();
                });
            });
        }
        filterBooksByType();
    }
    // --- End of setupBooksPageLogic ---

    // --- Setup for Projects Page ---
    function setupProjectsPageLogic() {
        const pageElement = document.getElementById('page-projects'); if (!pageElement) return;
        const toggleAllProjectsBtn = pageElement.querySelector('#toggle-all-projects');
        const pageCollapsibles = Array.from(pageElement.querySelectorAll('.entry .collapsible'));

        // MODIFIED: Add callback to update global button text
        pageCollapsibles.forEach(btn => {
            setupCollapsible(btn, () => {
                if (toggleAllProjectsBtn) { // Check if the global button exists
                    updateToggleAllButtonText(toggleAllProjectsBtn, pageCollapsibles);
                }
            });
        });

        if (toggleAllProjectsBtn) {
            if (pageCollapsibles.length > 0) {
                toggleAllProjectsBtn.style.display = '';
                // setupToggleAllButton will now use the modified updateToggleAllButtonText
                setupToggleAllButton(toggleAllProjectsBtn, pageCollapsibles);
            } else {
                 if (typeof updateToggleAllButtonText === 'function') { // Should always be true here
                    updateToggleAllButtonText(toggleAllProjectsBtn, []);
                 }
                 toggleAllProjectsBtn.style.display = 'none';
            }
        }
    }

    // --- Page Detection and Initialization ---
    const pageId = document.body.id;

    if (pageId === 'page-bio') { setupIndexPageLogic(); }
    else if (pageId === 'page-articles') { setupArticlesPageLogic(); }
    else if (pageId === 'page-books') { setupBooksPageLogic(); }
    else if (pageId === 'page-projects') { setupProjectsPageLogic(); }
    else {
        // For any other pages, setup collapsibles without a global callback
        document.querySelectorAll('.collapsible').forEach(btn => setupCollapsible(btn));
    }
});