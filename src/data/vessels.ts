import type { Vessel, ContourPoint } from '@/types/pottery';

const generateBowlContour = (): ContourPoint[] => {
  const points: ContourPoint[] = [];
  const numPoints = 100;
  for (let i = 0; i <= numPoints; i++) {
    const height = i / numPoints;
    const radius = Math.sin(height * Math.PI) * 0.8 + 0.1;
    points.push({ height, radius: Math.max(0, radius) });
  }
  return points;
};

const generateVaseContour = (): ContourPoint[] => {
  const points: ContourPoint[] = [];
  const numPoints = 100;
  for (let i = 0; i <= numPoints; i++) {
    const height = i / numPoints;
    let radius: number;
    if (height < 0.1) {
      radius = 0.2 + height * 2;
    } else if (height < 0.3) {
      radius = 0.4 - (height - 0.1) * 0.5;
    } else if (height < 0.7) {
      radius = 0.3 + Math.sin((height - 0.3) * Math.PI * 2.5) * 0.4;
    } else if (height < 0.9) {
      radius = 0.5 - (height - 0.7) * 1.5;
    } else {
      radius = 0.2 + (height - 0.9) * 1;
    }
    points.push({ height, radius: Math.max(0, radius) });
  }
  return points;
};

const generateJarContour = (): ContourPoint[] => {
  const points: ContourPoint[] = [];
  const numPoints = 100;
  for (let i = 0; i <= numPoints; i++) {
    const height = i / numPoints;
    let radius: number;
    if (height < 0.15) {
      radius = 0.15 + height * 1.5;
    } else if (height < 0.85) {
      const t = (height - 0.15) / 0.7;
      radius = 0.5 + Math.sin(t * Math.PI) * 0.35;
    } else {
      radius = 0.5 - (height - 0.85) * 2;
    }
    points.push({ height, radius: Math.max(0, radius) });
  }
  return points;
};

const generatePlateContour = (): ContourPoint[] => {
  const points: ContourPoint[] = [];
  const numPoints = 100;
  for (let i = 0; i <= numPoints; i++) {
    const height = i / numPoints;
    const radius = height < 0.3 
      ? 0.1 + height * 2.5 
      : 0.85 - (height - 0.3) * 0.5;
    points.push({ height, radius: Math.max(0, radius) });
  }
  return points;
};

const generateTeapotContour = (): ContourPoint[] => {
  const points: ContourPoint[] = [];
  const numPoints = 100;
  for (let i = 0; i <= numPoints; i++) {
    const height = i / numPoints;
    let radius: number;
    if (height < 0.1) {
      radius = 0.2 + height * 1;
    } else if (height < 0.6) {
      const t = (height - 0.1) / 0.5;
      radius = 0.3 + Math.sin(t * Math.PI) * 0.45;
    } else if (height < 0.85) {
      radius = 0.6 - (height - 0.6) * 1.2;
    } else {
      radius = 0.3 + (height - 0.85) * 0.5;
    }
    points.push({ height, radius: Math.max(0, radius) });
  }
  return points;
};

export const vessels: Vessel[] = [
  {
    id: 'bowl',
    name: '碗',
    description: '经典圆弧碗型，适合初学者练习对称曲线',
    targetContour: generateBowlContour(),
    previewPath: 'bowl',
    difficulty: 'easy',
  },
  {
    id: 'plate',
    name: '盘',
    description: '浅腹宽口盘型，练习肩部过渡技巧',
    targetContour: generatePlateContour(),
    previewPath: 'plate',
    difficulty: 'easy',
  },
  {
    id: 'jar',
    name: '罐',
    description: '圆润鼓腹罐型，练习腹部膨胀控制',
    targetContour: generateJarContour(),
    previewPath: 'jar',
    difficulty: 'medium',
  },
  {
    id: 'vase',
    name: '瓶',
    description: '复杂多曲线瓶型，高级技巧综合练习',
    targetContour: generateVaseContour(),
    previewPath: 'vase',
    difficulty: 'hard',
  },
  {
    id: 'teapot',
    name: '壶',
    description: '茶壶器型，练习多段曲线衔接',
    targetContour: generateTeapotContour(),
    previewPath: 'teapot',
    difficulty: 'hard',
  },
];

export const getVesselById = (id: string): Vessel | undefined => {
  return vessels.find(v => v.id === id);
};
