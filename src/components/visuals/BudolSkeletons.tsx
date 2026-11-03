import React from 'react';
import { Skeleton } from '@mantine/core';

export const ProductDetailsSkeleton: React.FC = () => (
  <div className="space-y-4" aria-busy="true" aria-live="polite">
    <div className="budol-card flex items-center gap-4">
      <Skeleton height={84} width={84} radius="lg" />
      <div className="flex-1 space-y-2">
        <Skeleton height={18} width="35%" radius="xl" />
        <Skeleton height={22} width="65%" radius="xl" />
        <Skeleton height={24} width="45%" radius="xl" />
      </div>
    </div>
    <div className="budol-card space-y-3">
      <Skeleton height={22} width="40%" radius="xl" />
      <Skeleton height={14} width="90%" radius="xl" />
      <Skeleton height={14} width="80%" radius="xl" />
      <Skeleton height={14} width="85%" radius="xl" />
      <Skeleton height={64} width="100%" radius="lg" />
    </div>
  </div>
);

export const ProductOverviewSkeleton = ProductDetailsSkeleton;

export const ReviewListSkeleton: React.FC = () => (
  <div className="space-y-3 py-2" aria-busy="true" aria-live="polite">
    {[1, 2].map((item) => (
      <div key={item} className="budol-card space-y-2 p-4">
        <div className="flex justify-between">
          <Skeleton height={14} width={80} radius="xl" />
          <Skeleton height={14} width={70} radius="xl" />
        </div>
        <Skeleton height={12} width="45%" radius="xl" />
        <Skeleton height={14} width="95%" radius="xl" />
        <Skeleton height={14} width="75%" radius="xl" />
      </div>
    ))}
  </div>
);

export const MascotCanvasSkeleton: React.FC<{ size?: number }> = ({ size = 160 }) => (
  <div
    style={{ width: size, height: size }}
    className="flex items-center justify-center"
  >
    <Skeleton height={Math.round(size * 0.78)} width={Math.round(size * 0.78)} circle />
  </div>
);
