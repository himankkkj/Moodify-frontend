import vinyl900 from "../../../assets/images/vinyl/vinyl-900.webp";
import vinyl700 from "../../../assets/images/vinyl/vinyl-700.webp";
import vinyl500 from "../../../assets/images/vinyl/vinyl-500.webp";
import "../styles/vinyl.scss";

const VinylRecord = ({ spinning = true, size = 850 }) => {
  return (
    <div
      className={`vinyl ${spinning ? "vinyl--spinning" : ""}`}
      style={{
        width: "100%",
        maxWidth: `${size}px`,
        aspectRatio: "1 / 1",
      }}
    >
      <picture>
        {/* Preloaded fast asset */}
        <source srcSet="/vinyl-hero.webp" media="(max-width: 768px)" type="image/webp" />
        <source srcSet={vinyl700} media="(max-width: 1024px)" type="image/webp" />
        <img
          src={vinyl900}
          width={size}
          height={size}
          alt="vinyl record"
          fetchPriority="high"
          decoding="sync"
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "contain" }}
        />
      </picture>
    </div>
  );
};

export default VinylRecord;
