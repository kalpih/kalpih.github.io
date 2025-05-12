document.addEventListener('DOMContentLoaded', function () {

    // --- Reusable Collapsible Function ---
    function setupCollapsible(button) {
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
            });

            if (isInitiallyExpanded && button.classList.contains('collapsible') && button.nextElementSibling && button.nextElementSibling.classList.contains('book-details-box')) {
                button.classList.add('followed-by-details-box');
            }
        }
    }

    // --- Reusable Update Toggle All Button Text Function ---
    // This is your original generic one, used by other pages.
    // The Books page now has more specific update functions within its own setup logic.
    function updateToggleAllButtonText(toggleButton, collapsibleButtons) {
        if (!toggleButton) return;
        const visibleControllableButtons = collapsibleButtons.filter(btn => {
            const parentSection = btn.closest('section');
            const parentEntry = btn.closest('.book-entry'); // Added for book entries as well
            const parentContainer = parentSection || parentEntry;
            return !parentContainer || parentContainer.style.display !== 'none';
        });

        if (visibleControllableButtons.length === 0) {
            // toggleButton.textContent = 'Expand all'; // Original
            // For safety, if no controllable buttons, let's set a default or hide
            // Consider what text makes sense if there's nothing to control, or disable the button
             toggleButton.textContent = 'Expand'; // Or 'Expand All' if that's a general fallback.
             // toggleButton.style.display = 'none'; // Or hide it
            return;
        }
        toggleButton.style.display = ''; // Ensure it's visible
        let allExpanded = true;
        visibleControllableButtons.forEach(btn => { if (!btn.classList.contains('active')) { allExpanded = false; } });
        // toggleButton.textContent = allExpanded ? 'Collapse all' : 'Expand all'; // Original
        // Adjusted based on your request for just "Expand" / "Collapse" for the general button
        // However, the Books page will use its own more specific text updaters.
        // This generic one might need adjustment if used elsewhere with the "Expand"/"Collapse" requirement.
        // For now, keeping its original text logic as it might be used by Bio/Projects.
        toggleButton.textContent = allExpanded ? 'Collapse all' : 'Expand all';
    }

    // --- Reusable Toggle All Collapsibles Function ---
    // This is your original generic one.
    function setupToggleAllButton(toggleButton, collapsibleButtons) {
        if (toggleButton && collapsibleButtons && collapsibleButtons.length > 0) {
            updateToggleAllButtonText(toggleButton, collapsibleButtons); // Uses the generic updater
            toggleButton.addEventListener('click', () => {
                // Original logic used "expand all". If this button is now "Expand", this needs adjustment.
                // For now, assuming its text is "Expand all" / "Collapse all" as per updateToggleAllButtonText
                const shouldExpand = toggleButton.textContent.toLowerCase().startsWith('expand'); // Make it more flexible
                const visibleControllableButtons = collapsibleButtons.filter(btn => {
                    const parentSection = btn.closest('section');
                    const parentEntry = btn.closest('.book-entry');
                    const parentContainer = parentSection || parentEntry;
                    return !parentContainer || parentContainer.style.display !== 'none';
                });
                if (visibleControllableButtons.length === 0) return;
                visibleControllableButtons.forEach(btn => {
                    const isCurrentlyExpanded = btn.classList.contains('active');
                    if ((shouldExpand && !isCurrentlyExpanded) || (!shouldExpand && isCurrentlyExpanded)) { btn.click(); }
                });
                updateToggleAllButtonText(toggleButton, visibleControllableButtons);
            });
        } else { if (toggleButton) { updateToggleAllButtonText(toggleButton, []); } } // Pass empty array
    }

    // --- Setup for Index Page (Bio) ---
    function setupIndexPageLogic() {
        const pageElement = document.getElementById('page-bio');
        if (!pageElement) return;
        const toggleAllBioBtn = pageElement.querySelector('#toggle-all'); // Assumes this ID on Bio page
        const pageCollapsibles = Array.from(pageElement.querySelectorAll('.entry .collapsible'));
        pageCollapsibles.forEach(setupCollapsible);
        if (toggleAllBioBtn) { // Use Array.from for NodeList if not already an array
            setupToggleAllButton(toggleAllBioBtn, Array.from(pageCollapsibles));
        }
    }

    // --- Setup for Articles Page ---
    function setupArticlesPageLogic() {
        const pageElement = document.getElementById('page-articles');
        if (!pageElement) return;

        const yearSectionCollapsibles = Array.from(pageElement.querySelectorAll('.entry > section > .collapsible'));
        const toggleAllArticlesBtn = pageElement.querySelector('#toggle-all'); // Assumes this ID on Articles page
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

            if (toggleAllArticlesBtn) { updateToggleAllButtonText(toggleAllArticlesBtn, controllableCollapsiblesForToggleAll); }
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
        yearSectionCollapsibles.forEach(setupCollapsible);
        if (toggleAllArticlesBtn) { setupToggleAllButton(toggleAllArticlesBtn, yearSectionCollapsibles); }

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
        filterAndToggleYearSections();
    } // --- End of setupArticlesPageLogic ---

    // =====================================================================================
    // START OF NEW/MODIFIED setupBooksPageLogic
    // =====================================================================================
    function setupBooksPageLogic() {
        const pageElement = document.getElementById('page-books');
        if (!pageElement) return;

        const toggleCoversBtn = pageElement.querySelector('#toggle-covers-button');
        const toggleDetailsBtn = pageElement.querySelector('#toggle-details-button'); // Changed ID

        const allBookEntries = Array.from(pageElement.querySelectorAll('.entry > .book-entry'));
        const imageContainers = Array.from(pageElement.querySelectorAll('.image-collapsible-content'));
        // These are the individual buttons controlling review/translation sections
        const detailsCollapsibleBtns = Array.from(pageElement.querySelectorAll('.short_resume_content > button.collapsible'));

        const filterButtons = pageElement.querySelectorAll('.book-type-filter-controls button[data-filter-type]');
        let currentBookTypeFilter = 'all';

        // Initial setup: Store original numbers for re-numbering if needed
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

        // Helper to get currently visible book entries
        function getVisibleBookEntries() {
            return allBookEntries.filter(entry => entry.style.display !== 'none');
        }

        // Helper to get relevant image containers (those within visible book entries)
        function getRelevantImageContainers() {
            const visibleEntries = getVisibleBookEntries();
            return imageContainers.filter(container => {
                const parentEntry = container.closest('.book-entry');
                return parentEntry && visibleEntries.includes(parentEntry);
            });
        }

        // Helper to get relevant detail control buttons (those within visible book entries)
        function getRelevantDetailsCollapsibleBtns() {
            const visibleEntries = getVisibleBookEntries();
            return detailsCollapsibleBtns.filter(btn => {
                const parentEntry = btn.closest('.book-entry');
                return parentEntry && visibleEntries.includes(parentEntry);
            });
        }

        // --- Covers Button Logic ---
        let allCoversAreGloballyShown = false; // State for covers (false = hidden, true = shown)

        function updateToggleCoversButtonText() {
            if (!toggleCoversBtn) return;
            const relevantContainers = getRelevantImageContainers();
            if (relevantContainers.length === 0) {
                toggleCoversBtn.textContent = 'Show Covers'; // Default if no relevant covers
                // toggleCoversBtn.disabled = true; // Optionally disable if you prefer
                return;
            }
            // toggleCoversBtn.disabled = false;
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

        // --- Details Button Logic ---
        function updateToggleDetailsButtonText() {
            if (!toggleDetailsBtn) return;
            const relevantDetailBtns = getRelevantDetailsCollapsibleBtns();
            if (relevantDetailBtns.length === 0) {
                toggleDetailsBtn.textContent = 'Expand'; // Default if no relevant details
                // toggleDetailsBtn.disabled = true; // Optionally disable
                return;
            }
            // toggleDetailsBtn.disabled = false;
            const allDetailsExpanded = relevantDetailBtns.every(btn => btn.classList.contains('active'));
            toggleDetailsBtn.textContent = allDetailsExpanded ? 'Collapse' : 'Expand';
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
                     // Ensure parent entry of this translation span is visible
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
            updateToggleDetailsButtonText();
        }

        detailsCollapsibleBtns.forEach(setupCollapsible); 

        imageContainers.forEach(container => {
            container.style.display = 'none';
        });
        allCoversAreGloballyShown = false; 

        updateToggleCoversButtonText();
        updateToggleDetailsButtonText();

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
    } // --- End of setupBooksPageLogic ---
    // =====================================================================================
    // END OF NEW/MODIFIED setupBooksPageLogic
    // =====================================================================================

    // --- Setup for Projects Page ---
    function setupProjectsPageLogic() {
        const pageElement = document.getElementById('page-projects'); if (!pageElement) return;
        const toggleAllProjectsBtn = pageElement.querySelector('#toggle-all-projects'); // Assumes this ID
        const pageCollapsibles = Array.from(pageElement.querySelectorAll('.entry .collapsible'));
        pageCollapsibles.forEach(setupCollapsible);
        if (toggleAllProjectsBtn) {
            if (pageCollapsibles.length > 0) {
                toggleAllProjectsBtn.style.display = ''; // Ensure it's visible if there are collapsibles
                setupToggleAllButton(toggleAllProjectsBtn, pageCollapsibles);
            } else {
                // updateToggleAllButtonText(toggleAllProjectsBtn, []); // Original line
                // toggleAllProjectsBtn.style.display = 'none'; // Hide if no collapsibles, or set default text
                // Safer:
                 if (typeof updateToggleAllButtonText === 'function') {
                    updateToggleAllButtonText(toggleAllProjectsBtn, []);
                 } else {
                    toggleAllProjectsBtn.textContent = "Expand"; // Fallback
                 }
                 toggleAllProjectsBtn.style.display = pageCollapsibles.length > 0 ? '' : 'none';
            }
        }
    }

    // --- Page Detection and Initialization ---
    const pageId = document.body.id;

    if (pageId === 'page-bio') { setupIndexPageLogic(); }
    else if (pageId === 'page-articles') { setupArticlesPageLogic(); }
    else if (pageId === 'page-books') { setupBooksPageLogic(); } // THIS WILL CALL THE NEW FUNCTION
    else if (pageId === 'page-projects') { setupProjectsPageLogic(); }
    else {
        // Fallback for any other pages with .collapsible elements
        document.querySelectorAll('.collapsible').forEach(setupCollapsible);
    }
});