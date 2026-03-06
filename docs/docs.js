// ConstructLM Documentation JavaScript

(function() {
    'use strict';
    
    // Navigation Section Toggle
    const navToggles = document.querySelectorAll('.toc-parent');
    
    navToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            const section = this.parentElement;
            const children = section.querySelector('.toc-children');
            const icon = this.querySelector('.toc-icon');
            
            if (children.classList.contains('active')) {
                children.classList.remove('active');
                icon.textContent = '+';
            } else {
                children.classList.add('active');
                icon.textContent = '-';
            }
        });
    });
    
    // Auto-generate "On This Page" index
    window.addEventListener('DOMContentLoaded', () => {
        const pageIndex = document.querySelector('.page-index');
        const headers = document.querySelectorAll('.docs-article h2, .docs-article h3');
        
        if (pageIndex && headers.length > 0) {
            pageIndex.innerHTML = '';
            headers.forEach(header => {
                if (!header.id) {
                    header.id = header.textContent.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                }
                const link = document.createElement('a');
                link.href = `#${header.id}`;
                link.textContent = header.textContent;
                if (header.tagName === 'H3') {
                    link.style.paddingLeft = '24px';
                }
                pageIndex.appendChild(link);
            });
        }
    });
    
    // Smooth scroll for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if (target) {
                const yOffset = -20;
                const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset;
                
                window.scrollTo({
                    top: y,
                    behavior: 'smooth'
                });
            }
        });
    });
    
    // Ask More Dropdown
    const askBtn = document.getElementById('ask-more-btn');
    const askDropdown = document.querySelector('.ask-more-dropdown');
    
    if (askBtn && askDropdown) {
        askBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            askDropdown.classList.toggle('active');
        });
        
        document.addEventListener('click', (e) => {
            if (!askDropdown.contains(e.target) && e.target !== askBtn) {
                askDropdown.classList.remove('active');
            }
        });
    }
    
    // Copy as Markdown
    const copyBtn = document.getElementById('copy-markdown-btn');
    if (copyBtn) {
        copyBtn.addEventListener('click', async () => {
            const article = document.querySelector('.docs-article');
            if (!article) return;
            
            let markdown = '';
            
            const processNode = (node) => {
                if (node.nodeType === Node.TEXT_NODE) {
                    return node.textContent.trim();
                }
                
                if (node.nodeType !== Node.ELEMENT_NODE) return '';
                
                const tag = node.tagName.toLowerCase();
                
                if (tag === 'button' || 
                    node.classList.contains('ask-more-container') ||
                    node.classList.contains('quick-links') ||
                    node.classList.contains('quick-link-card')) {
                    return '';
                }
                
                let content = '';
                for (let child of node.childNodes) {
                    content += processNode(child);
                }
                
                content = content.trim();
                if (!content) return '';
                
                switch (tag) {
                    case 'h1': return `# ${content}\n\n`;
                    case 'h2': return `## ${content}\n\n`;
                    case 'h3': return `### ${content}\n\n`;
                    case 'h4': return `#### ${content}\n\n`;
                    case 'p': return `${content}\n\n`;
                    case 'strong': return `**${content}**`;
                    case 'em': return `*${content}*`;
                    case 'code': return `\`${content}\``;
                    case 'pre': return `\`\`\`\n${content}\n\`\`\`\n\n`;
                    case 'ul':
                        let ul = '';
                        Array.from(node.children).forEach(li => {
                            if (li.tagName === 'LI') {
                                ul += `- ${processNode(li)}\n`;
                            }
                        });
                        return ul + '\n';
                    case 'ol':
                        let ol = '';
                        Array.from(node.children).forEach((li, i) => {
                            if (li.tagName === 'LI') {
                                ol += `${i + 1}. ${processNode(li)}\n`;
                            }
                        });
                        return ol + '\n';
                    case 'li': return content;
                    case 'a':
                        const href = node.getAttribute('href') || '';
                        if (href && !href.startsWith('#') && !node.classList.contains('quick-link-card')) {
                            return `[${content}](${href})`;
                        }
                        return content;
                    case 'div':
                        if (node.classList.contains('quick-links')) return '';
                        return content + '\n';
                    default: return content + (tag === 'section' ? '\n' : '');
                }
            };
            
            markdown = processNode(article);
            markdown = markdown.replace(/\n{3,}/g, '\n\n').trim();
            
            try {
                await navigator.clipboard.writeText(markdown);
                copyBtn.textContent = '✓ Copied!';
                setTimeout(() => {
                    copyBtn.textContent = 'Copy as Markdown';
                }, 2000);
            } catch (err) {
                console.error('Failed to copy:', err);
                alert('Failed to copy to clipboard');
            }
        });
    }
    
    // Ask ChatGPT
    const chatGPTBtn = document.getElementById('ask-chatgpt-btn');
    if (chatGPTBtn) {
        chatGPTBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const pageTitle = document.querySelector('.docs-article h1')?.textContent || 'ConstructLM Feature';
            const pageURL = window.location.href;
            
            const prompt = `I'm reading the ConstructLM documentation about "${pageTitle}". Can you help me understand this feature better?\n\nDocumentation URL: ${pageURL}`;
            const encodedPrompt = encodeURIComponent(prompt);
            const chatGPTURL = `https://chat.openai.com/?q=${encodedPrompt}`;
            
            window.open(chatGPTURL, '_blank');
        });
    }
    
})();
