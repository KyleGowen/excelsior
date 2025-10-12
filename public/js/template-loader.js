// Template Loader and Event Handler
class TemplateLoader {
    constructor() {
        this.templates = new Map();
        this.loaded = false;
    }

    // Load all templates
    async loadTemplates() {
        if (this.loaded) return;

        try {
            // Load deck editor template
            const deckEditorResponse = await fetch('/templates/deck-editor-template.html');
            const deckEditorHtml = await deckEditorResponse.text();
            this.templates.set('deck-editor', deckEditorHtml);

            // Load modal templates
            const modalResponse = await fetch('/templates/modal-templates.html');
            const modalHtml = await modalResponse.text();
            this.templates.set('modals', modalHtml);

            // Load database view template
            const dbViewResponse = await fetch('/templates/database-view-template.html');
            const dbViewHtml = await dbViewResponse.text();
            this.templates.set('database-view', dbViewHtml);

            this.loaded = true;
            console.log('✅ Templates loaded successfully');
        } catch (error) {
            console.error('❌ Error loading templates:', error);
        }
    }

    // Insert template into DOM
    insertTemplate(templateName, targetSelector) {
        const template = this.templates.get(templateName);
        if (!template) {
            console.error(`Template '${templateName}' not found`);
            return;
        }

        const target = document.querySelector(targetSelector);
        if (!target) {
            console.error(`Target selector '${targetSelector}' not found`);
            return;
        }

        target.insertAdjacentHTML('beforeend', template);
        this.bindEvents(target);
    }

    // Bind events for dynamically loaded content
    bindEvents(container) {
        // Handle modal close events
        const modals = container.querySelectorAll('[data-close-handler]');
        modals.forEach(modal => {
            const handler = modal.getAttribute('data-close-handler');
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    if (typeof window[handler] === 'function') {
                        window[handler]();
                    }
                }
            });
        });

        // Handle stop propagation
        const stopPropElements = container.querySelectorAll('[data-stop-propagation="true"]');
        stopPropElements.forEach(element => {
            element.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });

        // Handle click events
        const clickElements = container.querySelectorAll('[data-click-handler]');
        clickElements.forEach(element => {
            const handler = element.getAttribute('data-click-handler');
            const tab = element.getAttribute('data-tab');
            
            element.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof window[handler] === 'function') {
                    if (tab) {
                        window[handler](tab);
                    } else {
                        window[handler]();
                    }
                }
            });
        });

        // Handle edit events
        const editElements = container.querySelectorAll('[data-edit-handler]');
        editElements.forEach(element => {
            const handler = element.getAttribute('data-edit-handler');
            element.addEventListener('click', (e) => {
                e.preventDefault();
                if (typeof window[handler] === 'function') {
                    window[handler]();
                }
            });
        });
    }

    // Replace existing content with template
    replaceWithTemplate(templateName, targetSelector) {
        const template = this.templates.get(templateName);
        if (!template) {
            console.error(`Template '${templateName}' not found`);
            return;
        }

        const target = document.querySelector(targetSelector);
        if (!target) {
            console.error(`Target selector '${targetSelector}' not found`);
            return;
        }

        target.innerHTML = template;
        this.bindEvents(target);
    }
}

// Global template loader instance
window.templateLoader = new TemplateLoader();

// Initialize template loading when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
    await window.templateLoader.loadTemplates();
});
