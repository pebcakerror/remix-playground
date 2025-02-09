import { json } from "@remix-run/node";
import { Form, useLoaderData, useFetcher } from "@remix-run/react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import type { FunctionComponent } from "react";
import invariant from "tiny-invariant";

import { prisma } from "#app/utils/db.server.ts";

import { getContact, updateContact } from "../data";
import type { ContactRecord } from "../data";

export const action = async ({ params, request }: ActionFunctionArgs) => {
	invariant(params.contactSlug, "Missing contactSlug param");
	const formData = await request.formData();
	return updateContact(params.contactSlug, {
		favorite: formData.get("favorite") === "true",
	});
};

export const loader = async ({ params }: LoaderFunctionArgs) => {
	invariant(params.contactSlug, "Missing contactSlug param");
	// const contact = await getContact(params.contactSlug);
	const contact = await prisma.contact.findFirst({
		where: { slug: params.contactSlug },
	});
	if (!contact) {
		throw new Response("Not Found", { status: 404 });
	}
	return json({ contact });
};

export default function Contact() {
	const { contact } = useLoaderData<typeof loader>();

	return (
		<div id="contact">
			<div>
				{contact.avatar ? (
					<img
						alt={`${contact.first} ${contact.last} avatar`}
						key={contact.avatar}
						src={contact.avatar}
					/>
				) : null}
			</div>

			<div>
				<h1>
					{contact.first || contact.last ? (
						<>
							{contact.first} {contact.last}
						</>
					) : (
						<i>No Name</i>
					)}{" "}
					<Favorite contact={contact} />
				</h1>

				{contact.bio ? <p>{contact.bio}</p> : null}

				{contact.notes ? <p>{contact.notes}</p> : null}

				<div>
					<Form action="edit">
						<button type="submit">Edit</button>
					</Form>

					<Form
						action="destroy"
						method="post"
						onSubmit={(event) => {
							const response = confirm(
								"Please confirm you want to delete this record.",
							);
							if (!response) {
								event.preventDefault();
							}
						}}
					>
						<button type="submit">Delete</button>
					</Form>
				</div>
			</div>
		</div>
	);
}

const Favorite: FunctionComponent<{
	contact: Pick<ContactRecord, "favorite">;
}> = ({ contact }) => {
	const fetcher = useFetcher();
	const favorite = fetcher.formData
		? fetcher.formData.get("favorite") === "true"
		: contact.favorite;

	return (
		<fetcher.Form method="post">
			{/* biome-ignore lint/a11y/useButtonType: <explanation> */}
			<button
				aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
				name="favorite"
				value={favorite ? "false" : "true"}
			>
				{favorite ? "★" : "☆"}
			</button>
		</fetcher.Form>
	);
};
