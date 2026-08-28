// src/features/auth/components/AuthDrift.jsx
import { lazy, Suspense, memo } from 'react';

import cover1  from '../../../assets/images/albums/album1.webp';
import cover2  from '../../../assets/images/albums/album2.webp';
import cover3  from '../../../assets/images/albums/album3.webp';
import cover4  from '../../../assets/images/albums/album4.webp';
import cover5  from '../../../assets/images/albums/album5.webp';
import cover6  from '../../../assets/images/albums/album6.webp';
import cover7  from '../../../assets/images/albums/album7.webp';
import cover8  from '../../../assets/images/albums/album8.webp';
import cover9  from '../../../assets/images/albums/album9.webp';
import cover10 from '../../../assets/images/albums/album10.webp';
import cover11 from '../../../assets/images/albums/album11.webp';
import cover12 from '../../../assets/images/albums/album12.webp';

const DriftWall = lazy(() => import('../../landing/components/DriftWall'));

const authAlbums = [
  { image: cover1 }, { image: cover2 }, { image: cover3 },
  { image: cover4 }, { image: cover5 }, { image: cover6 },
  { image: cover7 }, { image: cover8 }, { image: cover9 },
  { image: cover10 }, { image: cover11 }, { image: cover12 },
];

export default memo(function AuthDrift() {
  return (
    <Suspense fallback={null}>
      <DriftWall
        items={authAlbums}
        columns={5}           // Less dense for half-screen
        tileWidth={180}
        tileHeight={148}
        gap={14}
        radius={0}
        tilt={18}
        turn={-7}
        perspective={1100}
        depth={80}
        speed={18}            // Slower than landing
        variance={0.4}
        parallax={0.8}        // Subtle mouse movement
        lift={30}
        fade={0.7}
        dim={0.65}            // Darker so form pops
        grayscale={true}
        overlayColor="#0A0A0A"
        pauseOnHover={false}
        roll={6}
      />
    </Suspense>
  );
});