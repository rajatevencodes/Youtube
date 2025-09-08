import { extractPublicId } from "cloudinary-build-url";

export const getPublicId = (avatarCloudinaryUrl: string) => {
  // Extract initial public ID (might include transformations)
  const rawPublicId = extractPublicId(avatarCloudinaryUrl);

  // We need to do more operation in order to extract the id
  // f_auto,q_auto/qk4k25jpoqj7hu4dhwwj?_a=BAMAJaP80
  // We just want this : qk4k25jpoqj7hu4dhwwj
  const match = rawPublicId.match(/(?:^|[,/])q_auto\/([^\/?]+)/);

  if (!match) {
    throw new Error("Failed to extract valid public ID from URL");
  }

  const finalPublicId = match[1];
  return finalPublicId;
};
