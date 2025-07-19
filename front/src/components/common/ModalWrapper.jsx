// src/components/common/ModalWrapper.jsx
import React from "react";
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  DialogTitle,
} from "@headlessui/react";
import { X } from "lucide-react";

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
        className={`bg-white rounded-lg shadow-lg p-6 z-10 w-full max-w-[95%] md:max-w-2xl ${panelClassName}`}
      >
        {title && (
          <DialogTitle
            as="h2"
            className="text-xl font-semibold mb-4 flex justify-between items-center"
          >
            <span>{title}</span>
            <span>
              <X
                className="h-5 w-5 text-gray-400 hover:text-gray-600 cursor-pointer"
                onClick={onClose}
              />
            </span>
          </DialogTitle>
        )}
        {children}
      </DialogPanel>
    </Dialog>
  );
}
