// blog_page.js

// Scroll handler for BlogDetail sections
export function handleScroll(setActiveSection) {
  const sections = ['section-1', 'section-2', 'section-3'];
  const scrollPosition = window.scrollY + 200; // Offset for better detection

  for (let i = sections.length - 1; i >= 0; i--) {
    const element = document.getElementById(sections[i]);
    if (element && element.offsetTop <= scrollPosition) {
      setActiveSection(sections[i]);
      break;
    }
  }
}
