import { createPortal } from 'react-dom';

const modalRootId = 'modal-root';

export function Portal({ children }) {
  let rootElement = document.getElementById(modalRootId);
  if (!rootElement) {
    rootElement = document.createElement('div');
    rootElement.id = modalRootId;
    document.body.appendChild(rootElement);
  }
  return createPortal(children, rootElement);
}
