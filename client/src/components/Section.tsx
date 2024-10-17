import { ReactNode } from "react";

interface SectionProps {
  title?: string;
  description?: string;
  yPadding?: string;
  children: ReactNode;
}

const Section = ({
  title,
  description,
  yPadding = "py-16",
  children,
}: SectionProps) => (
  <div className={`mx-auto max-w-screen-lg px-3 ${yPadding}`}>
    {(title || description) && (
      <div className="mb-12 text-center">
        {title && <h2 className="text-4xl font-bold text-gray-900">{title}</h2>}
        {description && (
          <div className="mt-4 text-xl md:px-20">{description}</div>
        )}
      </div>
    )}

    {children}
  </div>
);

export default Section;
