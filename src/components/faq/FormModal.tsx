import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import HomeHeroForm from '@/components/home/HomeHeroForm';

interface FormModalProps {
  open: boolean;
  onClose: () => void;
  source: string;
  title: string;
  subtitle?: string;
  prefilledMessage?: string;
}

const FormModal: React.FC<FormModalProps> = ({ open, onClose, source, title, subtitle, prefilledMessage }) => {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {subtitle && <DialogDescription>{subtitle}</DialogDescription>}
        </DialogHeader>
        <HomeHeroForm
          source={source}
          title=""
          subtitle=""
          prefilledMessage={prefilledMessage}
          onSuccess={() => setTimeout(onClose, 1500)}
        />
      </DialogContent>
    </Dialog>
  );
};

export default FormModal;
