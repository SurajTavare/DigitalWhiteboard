export type ShapeType = 'rectangle' | 'circle' | 'diamond' | 'square' | 'text' | 'line';
export type LineStyle = 'solid' | 'dashed' | 'dotted' | 'curved';
export type ArrowStyle = 'none' | 'start' | 'end' | 'both';

export interface Point {
  x: number;
  y: number;
}

export interface Shape {
  id: string;
  type: ShapeType;
  position: Point;
  text: string;
  borderColor?: string;
  borderWidth?: number;
  width?: number;
  height?: number;
  endPoint?: Point;
  controlPoints?: {
    cp1: Point;
    cp2: Point;
  };
}

export interface Connection {
  id: string;
  from: string;
  to: string;
  points: Point[];
  lineStyle: LineStyle;
  arrowStyle: ArrowStyle;
}

export interface DrawingPoint {
  x: number;
  y: number;
  type: 'start' | 'point' | 'end';
}

export interface DrawingPath {
  id: string;
  points: DrawingPoint[];
  color: string;
  width: number;
}

export interface DiagramState {
  shapes: Shape[];
  connections: Connection[];
  drawings: DrawingPath[];
  backgroundColor?: string;
}

export interface DiagramSuggestion {
  title: string;
  description: string;
  explanation: {
    title: string;
    content: string[];
  }[];
  elements: Shape[];
  connections: Connection[];
  category: string;
  tags: string[];
}