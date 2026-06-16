import { Component } from 'solid-js';
import { Dialog } from '@kobalte/core/dialog';
import { AlertTriangle, X } from 'lucide-solid';

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: Component<ConfirmDialogProps> = (props) => {
  const typeStyles = {
    danger: {
      icon: 'text-cinnabar-500',
      confirm: 'bg-cinnabar-500 hover:bg-cinnabar-600',
    },
    warning: {
      icon: 'text-amber-500',
      confirm: 'bg-amber-500 hover:bg-amber-600',
    },
    info: {
      icon: 'text-pottery-500',
      confirm: 'bg-pottery-500 hover:bg-pottery-600',
    },
  };

  const styles = () => typeStyles[props.type || 'warning'];

  return (
    <Dialog open={props.isOpen} onOpenChange={(open) => !open && props.onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50" />
        <Dialog.Content class="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md">
          <div class="bg-white rounded-2xl shadow-2xl p-6 mx-4 animate-slide-up">
            <div class="flex justify-between items-start mb-4">
              <div class="flex items-center gap-3">
                <div class={`p-2 rounded-full bg-pottery-100 ${styles().icon}`}>
                  <AlertTriangle class="w-6 h-6" />
                </div>
                <Dialog.Title class="text-xl font-display text-pottery-800">
                  {props.title}
                </Dialog.Title>
              </div>
              <Dialog.CloseButton class="p-1 hover:bg-pottery-100 rounded-lg transition-colors">
                <X class="w-5 h-5 text-pottery-500" />
              </Dialog.CloseButton>
            </div>

            <Dialog.Description class="text-pottery-600 mb-6 leading-relaxed">
              {props.message}
            </Dialog.Description>

            <div class="flex gap-3 justify-end">
              <button
                onClick={props.onClose}
                class="btn-secondary"
              >
                {props.cancelText || '取消'}
              </button>
              <button
                onClick={() => {
                  props.onConfirm();
                  props.onClose();
                }}
                class={`btn-primary text-white ${styles().confirm}`}
              >
                {props.confirmText || '确认'}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
};
