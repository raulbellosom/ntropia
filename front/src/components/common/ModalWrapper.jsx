// src/components/common/ModalWrapper.jsx
import React from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";

/**
 * ModalWrapper: Componente genérico para modales usando Headless UI.
 * Props:
 * - isOpen: boolean que controla apertura
 * - onClose: función para cerrar modal
 * - title: texto de título opcional
 * - children: contenido del modal
 * - panelClassName: clases adicionales para el panel
 */
export default function ModalWrapper({
  isOpen,
  onClose,
  title,
  children,
  panelClassName = "",
}) {
  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center"
    >
      <DialogBackdrop className="fixed inset-0 bg-black opacity-30" />

      <DialogPanel
        className={`bg-white rounded-lg shadow-lg p-6 z-10 w-full max-w-lg ${panelClassName}`}
      >
        {title && (
          <DialogTitle as="h2" className="text-xl font-semibold mb-4">
            {title}
          </DialogTitle>
        )}
        {children}
      </DialogPanel>
    </Dialog>
  );
}
