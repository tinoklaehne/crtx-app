"use client";

interface ClusterDescriptionProps {
  description: string;
}

export function ClusterDescription({ description }: ClusterDescriptionProps) {
  return (
    <div className="-mx-6 px-6 pb-6">
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}