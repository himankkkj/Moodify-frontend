import React, { useState, Children, useRef, useLayoutEffect, useEffect } from 'react'
import '../styles/stepper.scss'

export default function Stepper({
  children,
  initialStep = 1,
  onStepChange = () => {},
  onFinalStepCompleted = () => {},
  stepCircleContainerClassName = '',
  stepContainerClassName = '',
  contentClassName = '',
  footerClassName = '',
  backButtonProps = {},
  nextButtonProps = {},
  backButtonText = 'Back',
  nextButtonText = 'Continue',
  disableStepIndicators = false,
  renderStepIndicator,
  ...rest
}) {
  const [currentStep, setCurrentStep] = useState(initialStep)
  const [direction, setDirection] = useState(0)
  const [animating, setAnimating] = useState(false)
  const stepsArray = Children.toArray(children)
  const totalSteps = stepsArray.length
  const isCompleted = currentStep > totalSteps
  const isLastStep = currentStep === totalSteps

  const updateStep = (newStep) => {
    setCurrentStep(newStep)
    if (newStep > totalSteps) {
      onFinalStepCompleted()
    } else {
      onStepChange(newStep)
    }
  }

  const handleBack = () => {
    if (currentStep > 1 && !animating) {
      setDirection(-1)
      setAnimating(true)
      updateStep(currentStep - 1)
    }
  }

  const handleNext = () => {
    if (!isLastStep && !animating) {
      setDirection(1)
      setAnimating(true)
      updateStep(currentStep + 1)
    }
  }

  const handleComplete = () => {
    if (!animating) {
      setDirection(1)
      setAnimating(true)
      updateStep(totalSteps + 1)
    }
  }

  return (
    <div className="stepper-outer" {...rest}>
      <div className={`stepper-card ${stepCircleContainerClassName}`}>

        <div className={`stepper-indicator-row ${stepContainerClassName}`} role="tablist">
          {stepsArray.map((_, index) => {
            const stepNumber = index + 1
            const isNotLastStep = index < totalSteps - 1
            return (
              <React.Fragment key={stepNumber}>
                {renderStepIndicator ? (
                  renderStepIndicator({
                    step: stepNumber,
                    currentStep,
                    onStepClick: (clicked) => {
                      if (animating || clicked === currentStep) return
                      setDirection(clicked > currentStep ? 1 : -1)
                      setAnimating(true)
                      updateStep(clicked)
                    }
                  })
                ) : (
                  <StepIndicator
                    step={stepNumber}
                    disableStepIndicators={disableStepIndicators}
                    currentStep={currentStep}
                    onClickStep={(clicked) => {
                      if (animating || clicked === currentStep) return
                      setDirection(clicked > currentStep ? 1 : -1)
                      setAnimating(true)
                      updateStep(clicked)
                    }}
                  />
                )}
                {isNotLastStep && <StepConnector isComplete={currentStep > stepNumber} />}
              </React.Fragment>
            )
          })}
        </div>

        <StepContentWrapper
          isCompleted={isCompleted}
          currentStep={currentStep}
          direction={direction}
          animating={animating}
          onAnimationEnd={() => setAnimating(false)}
          className={`stepper-content ${contentClassName}`}
        >
          {stepsArray[currentStep - 1]}
        </StepContentWrapper>

        {!isCompleted && (
          <div className={`stepper-footer ${footerClassName}`}>
            <div className={`stepper-nav ${currentStep !== 1 ? 'spread' : 'end'}`}>
              {currentStep !== 1 && (
                <button
                  type="button"
                  onClick={handleBack}
                  className="stepper-btn stepper-btn--back"
                  disabled={animating}
                  {...backButtonProps}
                >
                  {backButtonText}
                </button>
              )}
              <button
                type="button"
                onClick={isLastStep ? handleComplete : handleNext}
                className="stepper-btn stepper-btn--next"
                disabled={animating}
                {...nextButtonProps}
              >
                {isLastStep ? 'START DETECTING' : nextButtonText}
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="stepper-counter" aria-live="polite">
        {Math.min(currentStep, totalSteps)} / {totalSteps}
      </p>
    </div>
  )
}

function StepContentWrapper({
  isCompleted,
  currentStep,
  direction,
  animating,
  onAnimationEnd,
  children,
  className
}) {
  const contentRef = useRef(null)
  const [height, setHeight] = useState('auto')
  const [slideClass, setSlideClass] = useState('')

  // Dynamically measure container height for card expansion
  useLayoutEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight || contentRef.current.offsetHeight)
    }
  }, [currentStep, children])

  useEffect(() => {
    if (!animating) return

    // ⚡ FIX 1: Correct Direction (Next = enter from right +50px, Prev = enter from left -50px)
    const enterClass = direction >= 0 ? 'slide-enter-next' : 'slide-enter-prev'

    // Step 1: Set initial hidden entry position
    setSlideClass(enterClass)

    // Step 2: Trigger smooth transition on next tick (bypasses React 18 batching)
    const activeTimer = setTimeout(() => {
      setSlideClass(`${enterClass} slide-active`)
    }, 20)

    // Step 3: Complete transition after 380ms
    const finishTimer = setTimeout(() => {
      setSlideClass('')
      onAnimationEnd()
    }, 380)

    return () => {
      clearTimeout(activeTimer)
      clearTimeout(finishTimer)
    }
  }, [animating, direction, currentStep])

  if (isCompleted) return null

  return (
    <div
      className={className}
      style={{
        height: height !== 'auto' ? `${height}px` : 'auto',
        transition: 'height 0.38s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        ref={contentRef}
        className={`stepper-slide ${slideClass}`}
      >
        {children}
      </div>
    </div>
  )
}

export function Step({ children }) {
  return <div className="stepper-step">{children}</div>
}

function StepIndicator({ step, currentStep, onClickStep, disableStepIndicators }) {
  const status = currentStep === step ? 'active' : currentStep < step ? 'inactive' : 'complete'
  const isClickable = step !== currentStep && !disableStepIndicators

  return (
    <div
      role="tab"
      aria-selected={status === 'active'}
      tabIndex={isClickable ? 0 : -1}
      onKeyDown={(e) => {
        if ((e.key === 'Enter' || e.key === ' ') && isClickable) {
          e.preventDefault()
          onClickStep(step)
        }
      }}
      onClick={() => {
        if (isClickable) onClickStep(step)
      }}
      className={`stepper-dot-wrap ${disableStepIndicators ? 'no-pointer' : ''}`}
    >
      <div className={`stepper-dot stepper-dot--${status}`}>
        {status === 'complete' ? (
          <CheckIcon />
        ) : status === 'active' ? (
          <div className="stepper-dot-inner" />
        ) : (
          <span className="stepper-dot-num">{step}</span>
        )}
      </div>
    </div>
  )
}

function StepConnector({ isComplete }) {
  return (
    <div className="stepper-connector" aria-hidden="true">
      <div
        className="stepper-connector-fill"
        style={{ width: isComplete ? '100%' : '0%' }}
      />
    </div>
  )
}

function CheckIcon() {
  return (
    <svg className="stepper-check" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  )
}