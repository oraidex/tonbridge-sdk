// block-utils
// source: https://keygen.sh/blog/how-to-use-hexadecimal-ed25519-keys-in-node/
export function pubkeyHexToEd25519DER(publicKey: string) {
  const key = Buffer.from(publicKey, "hex");

  // Ed25519's OID
  const oid = Buffer.from([0x06, 0x03, 0x2b, 0x65, 0x70]);

  // Create a byte sequence containing the OID and key
  const elements = Buffer.concat([
    Buffer.concat([
      Buffer.from([0x30]), // Sequence tag
      Buffer.from([oid.length]),
      oid,
    ]),
    Buffer.concat([
      Buffer.from([0x03]), // Bit tag
      Buffer.from([key.length + 1]),
      Buffer.from([0x00]), // Zero bit
      key,
    ]),
  ]);

  // Wrap up by creating a sequence of elements
  const der = Buffer.concat([
    Buffer.from([0x30]), // Sequence tag
    Buffer.from([elements.length]),
    elements,
  ]);

  return der;
}
