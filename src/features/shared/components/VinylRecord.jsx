import vinyl900 from "../../../assets/images/vinyl/vinyl-900.webp";
import vinyl700 from "../../../assets/images/vinyl/vinyl-700.webp";
import vinyl500 from "../../../assets/images/vinyl/vinyl-500.webp";
import "../styles/vinyl.scss";

const VinylRecord = ({ spinning = true, size = 700 }) => {
  return (
    <div
      className={`vinyl ${spinning ? "vinyl--spinning" : ""}`}
      style={{ width: size, height: size }}
    >
      <picture>
        <source srcSet={vinyl500} media="(max-width: 768px)" />
        <source srcSet={vinyl700} media="(max-width: 1024px)" />
        <img src={vinyl900} alt="vinyl record" fetchpriority="high"  decoding="async" />
      </picture>
    </div>
  );
};

export default VinylRecord;
