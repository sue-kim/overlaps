import { useEffect } from 'react';

export default function ProductGuide() {
  useEffect(() => {
    const dialog = document.querySelector<HTMLDialogElement>('#overlap-guide-dialog');
    if (!dialog) return;

    const guideTarget = (hash: string) => {
      const target = document.getElementById(hash.slice(1));
      return target && dialog.contains(target) ? target : null;
    };
    const open = (target: HTMLElement) => {
      if (!dialog.open) dialog.showModal();
      if (target instanceof HTMLDetailsElement) target.open = true;
      if (target.id === 'about-overlap') {
        dialog.querySelectorAll('details').forEach(details => { details.open = false; });
        dialog.scrollTop = 0;
      }
      else target.scrollIntoView({ block: 'start' });
    };
    const followHash = () => {
      const target = guideTarget(window.location.hash);
      if (target) open(target);
      else if (dialog.open) dialog.close();
    };
    const followLink = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target instanceof Element ? event.target.closest<HTMLAnchorElement>('a[href^="#"]') : null;
      if (!link) return;
      const hash = link.getAttribute('href')!;
      const target = guideTarget(hash);
      if (target) {
        event.preventDefault();
        if (window.location.hash !== hash) window.history.pushState(null, '', hash);
        open(target);
      } else if (hash === '#root' && dialog.contains(link)) {
        event.preventDefault();
        dialog.close();
        document.getElementById('root')?.focus({ preventScroll: true });
      }
    };
    const close = () => {
      if (guideTarget(window.location.hash)) {
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      }
      if (document.activeElement === document.body || dialog.contains(document.activeElement)) {
        document.querySelector<HTMLAnchorElement>('a[href="#about-overlap"]')?.focus({ preventScroll: true });
      }
    };
    const dismissBackdrop = (event: MouseEvent) => {
      if (event.target !== dialog) return;
      const bounds = dialog.getBoundingClientRect();
      if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    };

    document.addEventListener('click', followLink);
    window.addEventListener('hashchange', followHash);
    dialog.addEventListener('close', close);
    dialog.addEventListener('click', dismissBackdrop);
    followHash();
    return () => {
      document.removeEventListener('click', followLink);
      window.removeEventListener('hashchange', followHash);
      dialog.removeEventListener('close', close);
      dialog.removeEventListener('click', dismissBackdrop);
    };
  }, []);
  return null;
}
