import {IMdStepOption} from 'ngx-ui-tour-md-menu/lib/step-option.interface';
import {OnboardingGuideAnchor} from '../types/onboarding-guide-anchor.type';

/**
 * Ovveride of the default IMdStepOption to force the usage of the OnboardingGuideAnchor types, which are also used in the TypedTourAnchor
 * directive.
 */
interface OnboardingStep extends IMdStepOption {
  anchorId: OnboardingGuideAnchor;
  image?: string;
}

/**
 * Configuration object for an onboarding guide. Has a unique ID and a number of steps.
 */
export interface OnboardingGuideConfig {
  id: string;
  steps: OnboardingStep[];
}
