declare module "@jscad/stl-serializer" {
  interface SerializeOptions {
    binary?: boolean;
  }

  interface StlSerializer {
    serialize(options: SerializeOptions, model: any): ArrayBuffer[];
  }

  const stlSerializer: StlSerializer;
  export default stlSerializer;
}
