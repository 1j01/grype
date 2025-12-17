import { Grype } from "./grype.js";

const main = async () => {
	const grype = new Grype();
	document.body.append(grype.element);
};

main();
