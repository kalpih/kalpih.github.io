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
    // This function might need to be passed the specific lists it should check for different pages
    // For now, we'll keep its internal logic for specific pages if it has it.
    function updateToggleAllButtonText(toggleButton, collapsibleButtons) {
        if (!toggleButton) return;
        const visibleControllableButtons = collapsibleButtons.filter(btn => {
            const parentSection = btn.closest('section');
            const parentEntry = btn.closest('.book-entry'); // Relevant for books page
            const parentContainer = parentSection || parentEntry;
            return !parentContainer || parentContainer.style.display !== 'none';
        });

        if (visibleControllableButtons.length === 0 && !(document.body.id === 'page-books')) { // Keep text for books page even if no details, but images
            toggleButton.textContent = 'Expand all'; return;
        }
        
        toggleButton.style.display = ''; // Ensure it's visible

        // Specific logic for books page text update, as it considers images too
        if (document.body.id === 'page-books') {
            // This logic is from your setupBooksPageLogic's updateBooksPageToggleAllButtonText
            // We need to ensure allBookEntries and imageContainers are accessible or recalculated if this function is truly generic.
            // For simplicity, let's assume setupBooksPageLogic will call its own more specific update function or this one is adapted.
            // The version below was the one *inside* setupBooksPageLogic, so we'll use that if called from there.
            // This function is becoming a bit complex if it's meant to be generic.
            // Let's assume for now `collapsibleButtons` are the detail buttons for books page.
            const pageElement = document.getElementById('page-books');
            if (pageElement) { // Only run this detailed logic if on books page
                const allBookEntries = Array.from(pageElement.querySelectorAll('.entry > .book-entry'));
                const imageContainers = Array.from(pageElement.querySelectorAll('.image-collapsible-content'));

                const visibleBookEntries = allBookEntries.filter(entry => entry.style.display !== 'none');
                const allRelevantDetailButtons = [];
                visibleBookEntries.forEach(entry => {
                    allRelevantDetailButtons.push(...Array.from(entry.querySelectorAll('.short_resume_content > button.collapsible')));
                });
                const relevantImageContainers = imageContainers.filter(container => {
                    const parentEntry = container.closest('.book-entry');
                    return parentEntry && parentEntry.style.display !== 'none';
                });

                const anyImageHidden = relevantImageContainers.some(container => container.style.display === 'none');
                const anyDetailCollapsed = allRelevantDetailButtons.some(btn => !btn.classList.contains('active'));

                if (relevantImageContainers.length === 0 && allRelevantDetailButtons.length === 0) {
                    toggleButton.textContent = 'Expand all'; return;
                }
                if (anyImageHidden || anyDetailCollapsed) {
                    toggleButton.textContent = 'Expand all';
                } else {
                    toggleButton.textContent = 'Collapse all';
                }
                return; // Exit after books page specific logic
            }
        }

        // Generic part for other pages
        let allExpanded = true;
        visibleControllableButtons.forEach(btn => { if (!btn.classList.contains('active')) { allExpanded = false; } });
        toggleButton.textContent = allExpanded ? 'Collapse all' : 'Expand all';
    }


    // --- Reusable Toggle All Collapsibles Function ---
    function setupToggleAllButton(toggleButton, collapsibleButtons) { // collapsibleButtons here are the individual toggle triggers
        if (toggleButton && collapsibleButtons && collapsibleButtons.length > 0) {
            updateToggleAllButtonText(toggleButton, collapsibleButtons); // Initial text
            toggleButton.addEventListener('click', () => {
                const actionShouldBeExpand = toggleButton.textContent.toLowerCase().includes('expand all');
                
                const visibleControllableButtons = collapsibleButtons.filter(btn => {
                    const parentSection = btn.closest('section');
                    const parentEntry = btn.closest('.book-entry');
                    const parentContainer = parentSection || parentEntry;
                    return !parentContainer || parentContainer.style.display !== 'none';
                });

                if (visibleControllableButtons.length === 0 && !(document.body.id === 'page-books')) return;


                if (document.body.id === 'page-books') {
                    // Special handling for books page because of images + details
                    const pageElement = document.getElementById('page-books');
                    const allBookEntries = Array.from(pageElement.querySelectorAll('.entry > .book-entry'));
                    const imageContainers = Array.from(pageElement.querySelectorAll('.image-collapsible-content'));
                    const detailsCollapsibleBtns = Array.from(pageElement.querySelectorAll('.short_resume_content > button.collapsible'));


                    const relevantImageContainers = imageContainers.filter(container => {
                        const parentEntry = container.closest('.book-entry');
                        return parentEntry && parentEntry.style.display !== 'none';
                    });
                    const relevantDetailsCollapsibleBtns = detailsCollapsibleBtns.filter(btn => {
                        const parentEntry = btn.closest('.book-entry');
                        return parentEntry && parentEntry.style.display !== 'none';
                    });

                    relevantImageContainers.forEach(container => {
                        container.style.display = actionShouldBeExpand ? 'block' : 'none';
                    });
                    relevantDetailsCollapsibleBtns.forEach(btn => {
                        const isCurrentlyExpanded = btn.classList.contains('active');
                        if ((actionShouldBeExpand && !isCurrentlyExpanded) || (!actionShouldBeExpand && isCurrentlyExpanded)) {
                            btn.click();
                        }
                    });
                } else {
                    // Generic handling for other pages
                    visibleControllableButtons.forEach(btn => {
                        const isCurrentlyExpanded = btn.classList.contains('active');
                        if ((actionShouldBeExpand && !isCurrentlyExpanded) || (!actionShouldBeExpand && isCurrentlyExpanded)) {
                            btn.click();
                        }
                    });
                }
                updateToggleAllButtonText(toggleButton, collapsibleButtons); // Update text based on new state
            });
        } else { if (toggleButton) { updateToggleAllButtonText(toggleButton, []); } }
    }

    // --- Setup for Index Page (Bio) ---
    function setupIndexPageLogic() { 
        const pageElement = document.getElementById('page-bio');
        if (!pageElement) return;
        const toggleAllBioBtn = pageElement.querySelector('#toggle-all');
        const pageCollapsibles = pageElement.querySelectorAll('.entry .collapsible');
        pageCollapsibles.forEach(setupCollapsible);
        if (toggleAllBioBtn) {
            // Pass Array.from(pageCollapsibles) to satisfy the second argument expectation
            setupToggleAllButton(toggleAllBioBtn, Array.from(pageCollapsibles));
        }
    }

    // --- Setup for Articles Page ---
    function setupArticlesPageLogic() {
        const pageElement = document.getElementById('page-articles');
        if (!pageElement) return;

        const yearSectionCollapsibles = Array.from(pageElement.querySelectorAll('.entry > section > .collapsible'));
        const toggleAllArticlesBtn = pageElement.querySelector('#toggle-all');
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
        if (toggleAllArticlesBtn) { setupToggleAllButton(toggleAllArticlesBtn, yearSectionCollapsibles); } // Pass the year section collapsibles
        
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

    }


    // --- Setup for Books Page ---
    function setupBooksPageLogic() { 
        const pageElement = document.getElementById('page-books'); if (!pageElement) return;
        const toggleAllBooksBtn = pageElement.querySelector('#toggle-all-books');
        // These are the individual buttons for "Review essays", "Translations"
        const detailsCollapsibleBtns = Array.from(pageElement.querySelectorAll('.short_resume_content > button.collapsible'));
        // These are the div containers for images
        const imageContainers = Array.from(pageElement.querySelectorAll('.image-collapsible-content'));
        const filterButtons = pageElement.querySelectorAll('.book-type-filter-controls button[data-filter-type]');
        const allBookEntries = Array.from(pageElement.querySelectorAll('.entry > .book-entry'));
        let currentBookTypeFilter = 'all';

        allBookEntries.forEach(entry => { const numberSpan = entry.querySelector('.book-reference-text .entry-number'); if (numberSpan && numberSpan.textContent) { numberSpan.dataset.originalNumber = numberSpan.textContent.trim(); } });
        pageElement.querySelectorAll('.book-details-box[id^="target-translations-"] li .entry-number').forEach(span => { if (span.textContent) { span.dataset.originalNumber = span.textContent.trim(); } });
        
        function numberVisibleBookEntries() { /* ... (your existing numbering logic) ... */ if (allBookEntries.length === 0) return; const visibleEntriesData = []; allBookEntries.forEach(entry => { const numberSpan = entry.querySelector('.book-reference-text .entry-number'); if (!numberSpan) return; const isEntryVisible = entry.style.display !== 'none'; if (isEntryVisible) { visibleEntriesData.push({ element: entry, span: numberSpan }); numberSpan.style.visibility = 'visible'; } else { numberSpan.style.visibility = 'hidden'; entry.querySelectorAll('.book-details-box li .entry-number').forEach(subSpan => { subSpan.style.visibility = 'hidden'; }); } }); let currentNumber = 1; for (let i = visibleEntriesData.length - 1; i >= 0; i--) { const mainEntryData = visibleEntriesData[i]; const mainNumberOnly = currentNumber; const originalMainText = mainEntryData.span.dataset.originalNumber; let mainSuffix = ''; if (originalMainText) { const match = originalMainText.match(/[a-zA-Z]+(?=\.$)/); if (match) mainSuffix = match[0]; } mainEntryData.span.textContent = mainNumberOnly + mainSuffix + "."; const translationSpans = mainEntryData.element.querySelectorAll('.book-details-box[id^="target-translations-"] li .entry-number'); translationSpans.forEach(transSpan => { const originalTransText = transSpan.dataset.originalNumber; let transSuffix = ''; if (originalTransText) { const match = originalTransText.match(/[a-zA-Z]+(?=\.$)/); if (match) transSuffix = match[0]; } transSpan.textContent = mainNumberOnly + transSuffix + "."; transSpan.style.visibility = 'visible'; }); currentNumber++; } }
        function filterBooksByType() { /* ... (your existing filter logic) ... */ if (allBookEntries.length === 0) return; allBookEntries.forEach(entry => { const entryType = entry.dataset.bookType; const typeMatch = (currentBookTypeFilter === 'all' || entryType === currentBookTypeFilter); entry.style.display = typeMatch ? '' : 'none'; }); numberVisibleBookEntries(); updateBooksPageToggleAllButtonTextSpecific(); }
        
        detailsCollapsibleBtns.forEach(setupCollapsible); // Setup individual detail collapsibles
        imageContainers.forEach(container => { container.style.display = 'none'; }); // Initially hide image containers

        // Specific update text function for the books page "Expand/collapse all" button
        function updateBooksPageToggleAllButtonTextSpecific() {
            if (!toggleAllBooksBtn) return;

            const visibleBookEntries = allBookEntries.filter(entry => entry.style.display !== 'none');
            const allRelevantDetailButtons = [];
            visibleBookEntries.forEach(entry => {
                allRelevantDetailButtons.push(...Array.from(entry.querySelectorAll('.short_resume_content > button.collapsible')));
            });
            const relevantImageContainers = imageContainers.filter(container => {
                const parentEntry = container.closest('.book-entry');
                return parentEntry && parentEntry.style.display !== 'none';
            });

            const anyImageHidden = relevantImageContainers.some(container => container.style.display === 'none');
            const anyDetailCollapsed = allRelevantDetailButtons.some(btn => !btn.classList.contains('active'));

            if (relevantImageContainers.length === 0 && allRelevantDetailButtons.length === 0) {
                toggleAllBooksBtn.textContent = 'Expand all';
                // toggleAllBooksBtn.style.display = 'none'; // Optionally hide if nothing to toggle
                return;
            }
            toggleAllBooksBtn.style.display = '';

            if (anyImageHidden || anyDetailCollapsed) {
                toggleAllBooksBtn.textContent = 'Expand all';
            } else {
                toggleAllBooksBtn.textContent = 'Collapse all';
            }
        }
        updateBooksPageToggleAllButtonTextSpecific(); // Initial text set

        if (toggleAllBooksBtn) {
            toggleAllBooksBtn.addEventListener('click', () => {
                // Filter for currently visible items again, in case type filter changed
                const relevantImageContainers = imageContainers.filter(container => {
                    const parentEntry = container.closest('.book-entry');
                    return parentEntry && parentEntry.style.display !== 'none';
                });
                const relevantDetailsCollapsibleBtns = detailsCollapsibleBtns.filter(btn => {
                    const parentEntry = btn.closest('.book-entry');
                    return parentEntry && parentEntry.style.display !== 'none';
                });

                // Determine action based on current button text
                const actionShouldBeExpand = toggleAllBooksBtn.textContent.toLowerCase().includes('expand all');

                relevantImageContainers.forEach(container => {
                    container.style.display = actionShouldBeExpand ? 'block' : 'none';
                });

                relevantDetailsCollapsibleBtns.forEach(btn => {
                    const isCurrentlyExpanded = btn.classList.contains('active');
                    if ((actionShouldBeExpand && !isCurrentlyExpanded) || (!actionShouldBeExpand && isCurrentlyExpanded)) {
                        btn.click(); 
                    }
                });
                updateBooksPageToggleAllButtonTextSpecific(); // Update text based on the new state
            });
        }

        pageElement.querySelectorAll('.book-cover-placeholder img').forEach(img => { img.onerror = function() { const errorText = document.createElement('span'); errorText.className = 'error-text'; errorText.textContent = 'Cover not available'; if (this.parentElement && !this.parentElement.querySelector('.error-text')) { this.parentElement.appendChild(errorText); this.style.display='none'; } }; if (img.complete && !img.naturalWidth && img.src) { img.onerror(); } });
        if (filterButtons.length > 0) { filterButtons.forEach(button => { button.addEventListener('click', function() { currentBookTypeFilter = this.dataset.filterType; filterButtons.forEach(btn => btn.classList.remove('active-filter')); this.classList.add('active-filter'); this.blur(); filterBooksByType(); }); }); }
        filterBooksByType(); // Initial filter and numbering
    }

    // --- Setup for Projects Page ---
    function setupProjectsPageLogic() { 
        const pageElement = document.getElementById('page-projects'); if (!pageElement) return;
        const toggleAllProjectsBtn = pageElement.querySelector('#toggle-all-projects');
        const pageCollapsibles = Array.from(pageElement.querySelectorAll('.entry .collapsible'));
        pageCollapsibles.forEach(setupCollapsible);
        if (toggleAllProjectsBtn) {
            if (pageCollapsibles.length > 0) {
                toggleAllProjectsBtn.style.display = '';
                // Pass Array.from(pageCollapsibles) to satisfy the second argument expectation
                setupToggleAllButton(toggleAllProjectsBtn, Array.from(pageCollapsibles));
            } else {
                // Use the generic update function if no collapsibles
                updateToggleAllButtonText(toggleAllProjectsBtn, []);
                toggleAllProjectsBtn.style.display = ''; // Or 'none' if you prefer
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
        // Fallback for any other collapsibles on pages not specifically handled
        document.querySelectorAll('.collapsible').forEach(setupCollapsible);
    }
});