import { Entry, File, Folder } from "./entries";
import { HTMLFile } from "./HTMLFile";
import { register } from "../utils";

register(Entry);
register(File);
register(Folder);
register(HTMLFile);

export { File, Folder } from "./entries";
export { HTMLFile } from "./HTMLFile";
