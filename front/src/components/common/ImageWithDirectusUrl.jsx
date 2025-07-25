// src/components/common/ImageWithDirectusUrl.jsx
import React from "react";
import { useDirectusImage } from "../../hooks/useDirectusImage";

export default function ImageWithDirectusUrl({
  src,
  alt,
  className,
  ...props
}) {
  const url = useDirectusImage(src);
  return <img src={url} alt={alt} className={className} {...props} />;
}
