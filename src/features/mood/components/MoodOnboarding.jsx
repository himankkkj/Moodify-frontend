import { memo } from "react"
import Stepper, { Step } from "./Stepper"

import step1Img from "../../../assets/images/howitworks/step1-1400.webp"
import step2Img from "../../../assets/images/howitworks/step2-1400.webp"
import step3Img from "../../../assets/images/howitworks/step3-1400.webp"

const MoodOnboarding = memo(({ onComplete }) => {
  const handleComplete = () => {
    localStorage.setItem("moodify_onboarding_done", "true")
    onComplete()
  }

  return (
    <Stepper
      initialStep={1}
      onFinalStepCompleted={handleComplete}
      backButtonText="BACK"
      nextButtonText="NEXT →"
      disableStepIndicators={false}
    >

      <Step>
        <h2>GOOD <span>LIGHTING</span></h2>
        <img src={step1Img} alt="Good lighting example" />
        <p>
          Face a window or light source directly.
          Avoid shadows falling across your face — the AI reads subtle muscle movements.
        </p>
        <p className="stepper-privacy">No photos saved. Everything runs locally.</p>
      </Step>

      <Step>
        <h2>CLEAR <span>FACE</span></h2>
        <img src={step2Img} alt="Clear face example" />
        <p>
          Remove sunglasses, hats, or anything covering your face.
          Keep hair away from your eyes and forehead.
        </p>
      </Step>

      <Step>
        <h2>CENTRE <span>YOURSELF</span></h2>
        <img src={step3Img} alt="Face centred in frame" />
        <p>
          Look directly into the camera lens, not the screen.
          Keep your face centred in the frame — the scan takes just 3 seconds.
        </p>
      </Step>

      <Step>
        <h2>HOLD <span>STILL</span></h2>
        <p>
          Make a natural expression and hold it.
          Don't exaggerate — the model reads real micro-expressions best.
        </p>
        <p style={{ marginTop: "0.75rem" }}>
          Plain background behind you? Even better.
          Avoid busy or moving backgrounds.
        </p>
        <p style={{ marginTop: "1.5rem", fontSize: "var(--fs-small)", color: "#555", fontFamily: "sans-serif" }}>
          You're ready. Hit the button below.
        </p>
      </Step>

    </Stepper>
  )
})

MoodOnboarding.displayName = "MoodOnboarding"
export default MoodOnboarding