import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { ArrowRightIcon, FileTextIcon, ShieldCheckIcon, SparkleIcon } from '@phosphor-icons/react';
import { Modal } from './Modal';
import Building from './Building';

const steps = [
  {
    title: 'Everything home. A little clearer.',
    text: 'Your municipal accounts, properties and statements, together in one calm workspace. Made for life in South Africa.',
  },
  {
    title: 'Bring your bills. Find your balance.',
    text: 'Import a PDF, review its figures and keep the original. Billora gives your statements a proper home, with spending trends and calendar reminders.',
  },
  {
    title: 'Your accounts. Your control.',
    text: 'Your data stays in this browser on this device. Sample accounts help you explore. Start fresh in Settings whenever you’re ready. Payments stay on official municipal portals.',
  },
];
export function Onboarding({
  onClose,
  reduced,
  onStart,
}: {
  onClose: () => void;
  reduced: boolean;
  onStart: () => void;
}) {
  const [step, setStep] = useState(0);
  return (
    <Modal title="Welcome to a little more clarity." onClose={onClose}>
      <div className="onboarding">
        <div className={`onboarding-art step-${step}`}>
          {step === 0 ? (
            <Building small reduced={reduced} />
          ) : step === 1 ? (
            <div className="onboarding-papers">
              <span />
              <span />
              <FileTextIcon size={95} weight="duotone" />
              <span className="paper-check">
                <SparkleIcon size={24} />
              </span>
            </div>
          ) : (
            <div className="onboarding-shield">
              <ShieldCheckIcon size={100} weight="duotone" />
              <i />
              <i />
            </div>
          )}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, y: reduced ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : -8 }}
            className="onboarding-copy"
          >
            <h3>{steps[step].title}</h3>
            <p>{steps[step].text}</p>
          </motion.div>
        </AnimatePresence>
        <div className="onboarding-dots">
          {steps.map((_, i) => (
            <button
              key={i}
              className={step === i ? 'active' : ''}
              onClick={() => setStep(i)}
              aria-label={`Welcome step ${i + 1}`}
              aria-current={step === i ? 'step' : undefined}
            />
          ))}
        </div>
        <button
          className="button primary full"
          onClick={() => {
            if (step < 2) setStep(step + 1);
            else onStart();
          }}
        >
          {step === 2 ? 'Make yourself at home' : 'A little more'}
          <ArrowRightIcon />
        </button>
        <button className="text-button muted" onClick={onClose}>
          Explore at my own pace
        </button>
      </div>
    </Modal>
  );
}
