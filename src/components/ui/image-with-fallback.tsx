import React from "react";
import { motion } from "framer-motion";

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  fallbackSrc?: string;
}

const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
  src,
  alt = "",
  className,
  fallbackSrc = "/placeholder.svg",
  ...rest
}) => {
  const [resolvedSrc, setResolvedSrc] = React.useState<string | undefined>(src);
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    setResolvedSrc(src);
    setHasError(false);
  }, [src]);

  return (
    <motion.img
      src={hasError ? fallbackSrc : resolvedSrc}
      alt={alt}
      className={className}
      loading={rest.loading ?? "lazy"}
      decoding={rest.decoding ?? "async"}
      referrerPolicy={rest.referrerPolicy ?? "no-referrer"}
      // IMPORTANT: Do NOT force crossOrigin. It can block images without proper CORS.
      // Let callers opt-in via props if they truly need it.
      onError={() => setHasError(true)}
      {...rest}
    />
  );
};

export default ImageWithFallback;