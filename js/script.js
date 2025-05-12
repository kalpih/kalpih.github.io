document.addEventListener('DOMContentLoaded', function () {

    // --- Reusable Collapsible Function ---
    function setupCollapsible(button, isBookDetailButton = false, booksPageContext = null) {
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

                // If this is a book detail button, and the books page context is provided, update the main toggle button text
                if (isBookDetailButton && booksPageContext && booksPageContext.toggleAllDetailsBtn) {
                    // Brief delay to allow a_e attribute to update from setupCollapsible
                    setTimeout(booksPageContext.updateToggleAllDetailsButtonText, 50);
                }
            });

            if (isInitiallyExpanded && button.classList.contains('collapsible') && button.nextElementSibling && button.nextElementSibling.classList.contains('book-details-box')) {
                button.classList.add('followed-by-details-box');
            }
        }
    }

    // --- Reusable Update Toggle All Button Text Function (Generic for non-book pages) ---
    function updateGenericToggleAllButtonText(toggleButton, collapsibleButtons) {
        if (!toggleButton) return;
        const visibleControllableButtons = collapsibleButtons.filter(btn => {
            const parentSection = btn.closest('section'); // This might need to be more generic
            const parentContainer = parentSection; // Adjust if needed for other pages
            return !parentContainer || parentContainer.style.display !== 'none';
        });

        if (visibleControllableButtons.length === 0) {
            toggleButton.textContent = 'Expand all'; 
            // toggleButton.style.display = 'none'; // Optionally hide
            return;
        }
        toggleButton.style.display = '';
        let allExpanded = true;
        visibleControllableButtons.forEach(btn => { if (!btn.classList.contains('active')) { allExpanded = false; } });
        toggleButton.textContent = allExpanded ? 'Collapse all' : 'Expand all';
    }

    // --- Reusable Toggle All Collapsibles Function (Generic for non-book pages) ---
    function setupGenericToggleAllButton(toggleButton, collapsibleButtons) {
        if (toggleButton && collapsibleButtons && collapsibleButtons.length > 0) {
            updateGenericToggleAllButtonText(toggleButton, collapsibleButtons); // Initial text
            toggleButton.addEventListener('click', () => {
                const actionShouldExpand = toggleButton.textContent.toLowerCase().includes('expand all');
                
                const visibleControllableButtons = collapsibleButtons.filter(btn => {
                    const parentSection = btn.closest('section');
                    const parentContainer = parentSection; // Adjust if needed
                    return !parentContainer || parentContainer.style.display !== 'none';
                });

                if (visibleControllableButtons.length === 0) return;

                visibleControllableButtons.forEach(btn => {
                    const isCurrentlyExpanded = btn.classList.contains('active');
                    if ((actionShouldExpand && !isCurrentlyExpanded) || (!actionShouldExpand && isCurrentlyExpanded)) {
                        btn.click();
                    }
                });
                updateGenericToggleAllButtonText(toggleButton, collapsibleButtons); // Update text based on new state
            });
        } else { if (toggleButton) { updateGenericToggleAllButtonText(toggleButton, []); } }
    }

    // --- Setup for Index Page (Bio) ---
    function setupIndexPageLogic() { 
        const pageElement = document.getElementById('page-bio');
        if (!pageElement) return;
        const toggleAllBioBtn = pageElement.querySelector('#toggle-all');
        const pageCollapsibles = Array.from(pageElement.querySelectorAll('.entry .collapsible'));
        pageCollapsibles.forEach(btn => setupCollapsible(btn)); // Use basic setup
        if (toggleAllBioBtn) {
            setupGenericToggleAllButton(toggleAllBioBtn, pageCollapsibles);
        }
    }

    // --- Setup for Articles Page ---
    function setupArticlesPageLogic() {
        const pageElement = document.getElementById('page-articles');
        if (!pageElement) return;

        const yearSectionCollapsibles = Array.from(pageElement.querySelectorAll('.entry > section > .collapsible'));
        const toggleAllArticlesBtn = pageElement.querySelector('#toggle-all');
        // ... (rest of your existing articles page variables and logic, unchanged) ...
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
        function injectRelatedArticleLinks() { /* ... your existing complex injectRelatedArticleLinks logic ... */ articleLookup.forEach(currentArticleData => { const currentId = currentArticleData.id; const liElement = currentArticleData.element; let linksContainer = liElement.querySelector('.related-article-links'); if (!linksContainer) { linksContainer = document.createElement('span'); linksContainer.className = 'related-article-links'; liElement.appendChild(linksContainer); } linksContainer.innerHTML = '';  if (liElement.style.display === 'none') { return; } const groupId = currentArticleData.isSecondary ? currentArticleData.primaryRefId : currentId; const relatedIdsInGroup = articleGroups.get(groupId); if (relatedIdsInGroup && relatedIdsInGroup.size > 1) { const allIdsInGroup = Array.from(relatedIdsInGroup); let linksHtml = [];  let prefixHTML = '&nbsp;<span class="related-links-prefix">(Also:</span> ';  let suffixHTML = '<span class="related-links-suffix">)</span>'; let specialCaseHandled = false; if (allIdsInGroup.length === 2) { const otherId = allIdsInGroup.find(id => id !== currentId); const otherArticleData = articleLookup.get(otherId); if (otherArticleData) { const currentPrimaryLang = currentArticleData.lang.split(' ')[0]; const otherPrimaryLang = otherArticleData.lang.split(' ')[0]; if (currentPrimaryLang === otherPrimaryLang) {  specialCaseHandled = true; const currentOriginalNumStr = currentArticleData.originalNumber.replace('.', '') || '0'; const otherOriginalNumStr = otherArticleData.originalNumber.replace('.', '') || '0'; const currentOriginalNum = parseInt(currentOriginalNumStr, 10) || 0; const otherOriginalNum = parseInt(otherOriginalNumStr, 10) || 0; let linkText = ''; let prefixTextForSpanContent = ''; if (currentOriginalNum === 0 || otherOriginalNum === 0) { specialCaseHandled = false; }  else if (currentOriginalNum < otherOriginalNum) { prefixTextForSpanContent = '(Also:'; linkText = 'Republished'; suffixHTML = '<span class="related-links-suffix">)</span>'; }  else { prefixTextForSpanContent = '(Republished.'; linkText = 'Original'; suffixHTML = '<span class="related-links-suffix">)</span>'; } if (specialCaseHandled && linkText) { prefixHTML = `&nbsp;<span class="related-links-prefix">${prefixTextForSpanContent}</span> `; linksHtml.push(`<a href="#${otherArticleData.id}" class="related-link" title="View ${linkText.toLowerCase()} version: ${otherArticleData.title} (${otherArticleData.lang})">${linkText}</a>`); }  else { specialCaseHandled = false; } }  }  }  if (!specialCaseHandled) { prefixHTML = '&nbsp;<span class="related-links-prefix">(Also:</span> ';  suffixHTML = '<span class="related-links-suffix">)</span>'; allIdsInGroup.forEach(relatedId => { if (relatedId !== currentId) { const relatedArticleData = articleLookup.get(relatedId); if (relatedArticleData) { const langText = relatedArticleData.lang.split(' ')[0].toUpperCase(); linksHtml.push(`<a href="#${relatedArticleData.id}" class="related-link" title="View version: ${relatedArticleData.title} (${relatedArticleData.lang})">${langText}</a>`); } } }); } if (linksHtml.length > 0) { linksContainer.innerHTML = prefixHTML + linksHtml.join(' ') + suffixHTML; }  else { linksContainer.innerHTML = ''; } } else { linksContainer.innerHTML = ''; } }); }
        function defaultScrollHighlight(targetElement) { /* ... your existing defaultScrollHighlight logic ... */  targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });  document.querySelectorAll('li.highlighted-article').forEach(el => el.classList.remove('highlighted-article'));  targetElement.classList.add('highlighted-article');  setTimeout(() => { targetElement.classList.remove('highlighted-article'); }, 2500); }
        function resetFiltersIfNeeded(actionCallback) { /* ... your existing resetFiltersIfNeeded logic ... */ let langFilterChanged = false; let statusFilterChanged = false; if (currentLangFilter !== 'all') { const allLangButton = Array.from(langFilterButtons).find(btn => btn.dataset.filterLang === 'all'); if (allLangButton) { allLangButton.click(); langFilterChanged = true; } } if (currentStatusFilter !== 'all') { const allStatusButton = Array.from(statusFilterButtons).find(btn => btn.dataset.filterStatus === 'all'); if (allStatusButton) { allStatusButton.click(); statusFilterChanged = true; } } if (langFilterChanged || statusFilterChanged) { setTimeout(actionCallback, 200); }  else { actionCallback(); } }
        function handleRelatedLinkClick(e) { /* ... your existing handleRelatedLinkClick logic ... */  if (e.target.matches('a.related-link')) {  e.preventDefault();  const targetId = e.target.getAttribute('href').substring(1);  const targetElement = document.getElementById(targetId);  if (targetElement) { const actionAfterFilters = () => { const collapsibleContentParent = targetElement.closest('.collapsible-content'); if (collapsibleContentParent && collapsibleContentParent.style.display === 'none') { const buttonId = collapsibleContentParent.getAttribute('aria-labelledby'); const yearToggleButton = document.getElementById(buttonId); if (yearToggleButton && !yearToggleButton.classList.contains('active')) { yearToggleButton.click();  setTimeout(() => { defaultScrollHighlight(targetElement); }, 150);  return;  } } defaultScrollHighlight(targetElement);  }; resetFiltersIfNeeded(actionAfterFilters); } } }
        function renumberVisibleArticles() { /* ... your existing renumberVisibleArticles logic ... */  if (!allArticleItemsContainer || potentialItems.length === 0) return; const allVisibleItems = []; potentialItems.forEach(item => { const numberSpan = item.querySelector('.article-number'); if (!numberSpan) return; const sectionContainer = item.closest('section'); const isSectionVisible = sectionContainer ? sectionContainer.style.display !== 'none' : true; const isItemIndividuallyVisible = item.style.display !== 'none'; const isVisible = isItemIndividuallyVisible && isSectionVisible; numberSpan.style.visibility = 'hidden'; if (isVisible) { const articleData = articleLookup.get(item.id); const originalNumberText = articleData ? articleData.originalNumber : (numberSpan.dataset.originalNumber || ""); allVisibleItems.push({ element: item, span: numberSpan, originalNumber: originalNumberText }); } }); let currentDisplayNumber = 1; for (let i = allVisibleItems.length - 1; i >= 0; i--) { const itemData = allVisibleItems[i]; if (!itemData || !itemData.span) continue; const displayNumber = currentDisplayNumber; const originalText = itemData.originalNumber; let suffix = ''; const match = originalText.match(/[a-zA-Z]+(?=\.$)/); if (match) { suffix = match[0]; } itemData.span.textContent = displayNumber + suffix + "."; itemData.span.style.visibility = 'visible'; currentDisplayNumber++; } }
        function filterAndToggleYearSections() { /* ... your existing filterAndToggleYearSections logic ... */ if (potentialItems.length === 0 && yearSectionCollapsibles.length > 0) {  yearSectionCollapsibles.forEach(button => { const sectionContainer = button.closest('section'); if (sectionContainer) sectionContainer.style.display = 'none'; }); if (toggleAllArticlesBtn) { updateGenericToggleAllButtonText(toggleAllArticlesBtn, []); }  renumberVisibleArticles(); injectRelatedArticleLinks(); return;  } else if (potentialItems.length === 0) {  renumberVisibleArticles(); injectRelatedArticleLinks();  if (toggleAllArticlesBtn) { updateGenericToggleAllButtonText(toggleAllArticlesBtn, []); } return;  } potentialItems.forEach(item => { const itemLangsArray = item.dataset.lang ? item.dataset.lang.split(' ') : []; const firstLang = itemLangsArray.length > 0 ? itemLangsArray[0].trim() : null; let langMatch = false; if (currentLangFilter === 'all') { langMatch = true; }  else if (firstLang && firstLang === currentLangFilter) { langMatch = true; } const itemStatus = item.dataset.status || 'unknown'; let statusMatch = false;  if (currentStatusFilter === 'all') { statusMatch = true; } else if (currentStatusFilter === 'article') { statusMatch = (itemStatus === 'refereed-article' || itemStatus === 'non-refereed-article'); } else if (currentStatusFilter === 'chapter') { statusMatch = (itemStatus === 'refereed-chapter' || itemStatus === 'non-refereed-chapter'); } else if (currentStatusFilter === 'refereed') { statusMatch = (itemStatus === 'refereed-article' || itemStatus === 'refereed-chapter'); } else { statusMatch = (itemStatus === currentStatusFilter); } item.style.display = (langMatch && statusMatch) ? 'list-item' : 'none'; item.classList.remove('article-item-needs-top-margin');  }); let controllableCollapsiblesForToggleAll = []; const yearSections = pageElement.querySelectorAll('.entry > section');  yearSections.forEach(section => {  const collapsibleButton = section.querySelector('button.collapsible'); const contentDiv = section.querySelector('div.collapsible-content'); let sectionShouldBeVisible = false; if (contentDiv) { const list = contentDiv.querySelector('ul'); if (list) { const visibleItemsInList = Array.from(list.children).filter(li => li.matches('li[data-lang][data-status]') && li.style.display !== 'none'); if (visibleItemsInList.length > 0) { sectionShouldBeVisible = true; } } } section.style.display = sectionShouldBeVisible ? 'block' : 'none'; if(sectionShouldBeVisible && collapsibleButton) { controllableCollapsiblesForToggleAll.push(collapsibleButton); } });  const allYearULs = pageElement.querySelectorAll('.entry > section > .collapsible-content > ul'); allYearULs.forEach(ul => { const parentSection = ul.closest('section'); if (parentSection && parentSection.style.display === 'none') { return; } let firstVisibleChildInThisULFound = false;  Array.from(ul.children).forEach(li => { if (li.matches('li[data-lang][data-status]')) {  if (li.style.display !== 'none') {  if (firstVisibleChildInThisULFound) { li.classList.add('article-item-needs-top-margin'); } firstVisibleChildInThisULFound = true;  } } }); }); renumberVisibleArticles();  injectRelatedArticleLinks();  if (toggleAllArticlesBtn) { updateGenericToggleAllButtonText(toggleAllArticlesBtn, controllableCollapsiblesForToggleAll); } }

        if (langFilterButtons.length > 0) { /* ... */ }
        if (statusFilterButtons.length > 0) { /* ... */ }
        yearSectionCollapsibles.forEach(btn => setupCollapsible(btn)); // Use basic setup
        if (toggleAllArticlesBtn) { setupGenericToggleAllButton(toggleAllArticlesBtn, yearSectionCollapsibles); }
        if (allArticleItemsContainer) { /* ... */ }
        const latestArticleLinks = pageElement.querySelectorAll('.latest-section-box .static-box-content ul li a');
        latestArticleLinks.forEach(link => { /* ... */ });
        filterAndToggleYearSections();
    }


    // --- Setup for Books Page ---
    function setupBooksPageLogic() { 
        const pageElement = document.getElementById('page-books');
        if (!pageElement) return;

        const toggleAllDetailsBtn = pageElement.querySelector('#toggle-all-details-btn');
        const toggleAllCoversBtn = pageElement.querySelector('#toggle-all-covers-btn');

        const detailsCollapsibleBtns = Array.from(pageElement.querySelectorAll('.short_resume_content > button.collapsible'));
        const imageContainers = Array.from(pageElement.querySelectorAll('.image-collapsible-content'));
        const filterButtons = pageElement.querySelectorAll('.book-type-filter-controls button[data-filter-type]');
        const allBookEntries = Array.from(pageElement.querySelectorAll('.entry > .book-entry'));
        let currentBookTypeFilter = 'all';

        allBookEntries.forEach(entry => { const numberSpan = entry.querySelector('.book-reference-text .entry-number'); if (numberSpan && numberSpan.textContent) { numberSpan.dataset.originalNumber = numberSpan.textContent.trim(); } });
        pageElement.querySelectorAll('.book-details-box[id^="target-translations-"] li .entry-number').forEach(span => { if (span.textContent) { span.dataset.originalNumber = span.textContent.trim(); } });
        
        function numberVisibleBookEntries() { if (allBookEntries.length === 0) return; const visibleEntriesData = []; allBookEntries.forEach(entry => { const numberSpan = entry.querySelector('.book-reference-text .entry-number'); if (!numberSpan) return; const isEntryVisible = entry.style.display !== 'none'; if (isEntryVisible) { visibleEntriesData.push({ element: entry, span: numberSpan }); numberSpan.style.visibility = 'visible'; } else { numberSpan.style.visibility = 'hidden'; entry.querySelectorAll('.book-details-box li .entry-number').forEach(subSpan => { subSpan.style.visibility = 'hidden'; }); } }); let currentNumber = 1; for (let i = visibleEntriesData.length - 1; i >= 0; i--) { const mainEntryData = visibleEntriesData[i]; const mainNumberOnly = currentNumber; const originalMainText = mainEntryData.span.dataset.originalNumber; let mainSuffix = ''; if (originalMainText) { const match = originalMainText.match(/[a-zA-Z]+(?=\.$)/); if (match) mainSuffix = match[0]; } mainEntryData.span.textContent = mainNumberOnly + mainSuffix + "."; const translationSpans = mainEntryData.element.querySelectorAll('.book-details-box[id^="target-translations-"] li .entry-number'); translationSpans.forEach(transSpan => { const originalTransText = transSpan.dataset.originalNumber; let transSuffix = ''; if (originalTransText) { const match = originalTransText.match(/[a-zA-Z]+(?=\.$)/); if (match) transSuffix = match[0]; } transSpan.textContent = mainNumberOnly + transSuffix + "."; transSpan.style.visibility = 'visible'; }); currentNumber++; } }
        
        const booksPageContextForCollapsible = { // Object to pass context if needed
            toggleAllDetailsBtn: toggleAllDetailsBtn,
            updateToggleAllDetailsButtonText: updateToggleAllDetailsButtonText // Pass the function itself
        };

        detailsCollapsibleBtns.forEach(btn => {
             // Pass true for isBookDetailButton, and the context object
            setupCollapsible(btn, true, booksPageContextForCollapsible);
        });
        
        imageContainers.forEach(container => {
            container.style.display = 'none'; // Initially hide image containers
        });

        function updateToggleAllCoversButtonText() {
            if (!toggleAllCoversBtn) return;
            const relevantImageContainers = imageContainers.filter(container => {
                const parentEntry = container.closest('.book-entry');
                return parentEntry && parentEntry.style.display !== 'none';
            });
            if (relevantImageContainers.length === 0) {
                toggleAllCoversBtn.textContent = 'Show covers';
                toggleAllCoversBtn.style.display = 'none'; // Hide if no relevant covers
                return;
            }
            toggleAllCoversBtn.style.display = '';
            const anyImageHidden = relevantImageContainers.some(container => container.style.display === 'none');
            toggleAllCoversBtn.textContent = anyImageHidden ? 'Show covers' : 'Hide covers';
        }

        function updateToggleAllDetailsButtonText() {
            if (!toggleAllDetailsBtn) return;
            const visibleBookEntries = allBookEntries.filter(entry => entry.style.display !== 'none');
            const allRelevantDetailButtons = [];
            visibleBookEntries.forEach(entry => {
                allRelevantDetailButtons.push(...Array.from(entry.querySelectorAll('.short_resume_content > button.collapsible')));
            });
            if (allRelevantDetailButtons.length === 0) {
                toggleAllDetailsBtn.textContent = 'Expand details';
                toggleAllDetailsBtn.style.display = 'none'; // Hide if no relevant details
                return;
            }
            toggleAllDetailsBtn.style.display = '';
            const anyDetailCollapsed = allRelevantDetailButtons.some(btn => !btn.classList.contains('active'));
            toggleAllDetailsBtn.textContent = anyDetailCollapsed ? 'Expand details' : 'Collapse details';
        }

        if (toggleAllCoversBtn) {
            toggleAllCoversBtn.addEventListener('click', () => {
                const relevantImageContainers = imageContainers.filter(container => {
                    const parentEntry = container.closest('.book-entry');
                    return parentEntry && parentEntry.style.display !== 'none';
                });
                const actionShouldShowCovers = toggleAllCoversBtn.textContent.toLowerCase().includes('show covers');
                relevantImageContainers.forEach(container => {
                    container.style.display = actionShouldShowCovers ? 'block' : 'none';
                });
                updateToggleAllCoversButtonText();
            });
        }

        if (toggleAllDetailsBtn) {
            toggleAllDetailsBtn.addEventListener('click', () => {
                const relevantDetailsCollapsibleBtns = detailsCollapsibleBtns.filter(btn => {
                    const parentEntry = btn.closest('.book-entry');
                    return parentEntry && parentEntry.style.display !== 'none';
                });
                const actionShouldExpandDetails = toggleAllDetailsBtn.textContent.toLowerCase().includes('expand details');
                relevantDetailsCollapsibleBtns.forEach(btn => {
                    const isCurrentlyExpanded = btn.classList.contains('active');
                    if ((actionShouldExpandDetails && !isCurrentlyExpanded) || (!actionShouldExpandDetails && isCurrentlyExpanded)) {
                        btn.click();
                    }
                });
                // The text update will be triggered by individual button clicks via setupCollapsible's modification
                // Or call it here with a timeout if preferred for an immediate overall update:
                setTimeout(updateToggleAllDetailsButtonText, 100);
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
            updateToggleAllCoversButtonText();
            updateToggleAllDetailsButtonText();
        }

        if (filterButtons.length > 0) { filterButtons.forEach(button => { button.addEventListener('click', function() { currentBookTypeFilter = this.dataset.filterType; filterButtons.forEach(btn => btn.classList.remove('active-filter')); this.classList.add('active-filter'); this.blur(); filterBooksByType(); }); }); }
        
        pageElement.querySelectorAll('.book-cover-placeholder img').forEach(img => { img.onerror = function() { const errorText = document.createElement('span'); errorText.className = 'error-text'; errorText.textContent = 'Cover not available'; if (this.parentElement && !this.parentElement.querySelector('.error-text')) { this.parentElement.appendChild(errorText); this.style.display='none'; } }; if (img.complete && !img.naturalWidth && img.src) { img.onerror(); } });

        filterBooksByType(); // Initial filter call
        updateToggleAllCoversButtonText(); // Initial text for covers
        updateToggleAllDetailsButtonText(); // Initial text for details
    }

    // --- Setup for Projects Page ---
    function setupProjectsPageLogic() { 
        const pageElement = document.getElementById('page-projects'); if (!pageElement) return;
        const toggleAllProjectsBtn = pageElement.querySelector('#toggle-all-projects');
        const pageCollapsibles = Array.from(pageElement.querySelectorAll('.entry .collapsible'));
        pageCollapsibles.forEach(btn => setupCollapsible(btn)); // Use basic setup
        if (toggleAllProjectsBtn) {
            if (pageCollapsibles.length > 0) {
                toggleAllProjectsBtn.style.display = '';
                setupGenericToggleAllButton(toggleAllProjectsBtn, pageCollapsibles);
            } else {
                updateGenericToggleAllButtonText(toggleAllProjectsBtn, []);
                toggleAllProjectsBtn.style.display = 'none'; // Hide if no collapsibles
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
        document.querySelectorAll('.collapsible').forEach(btn => setupCollapsible(btn));
    }
});