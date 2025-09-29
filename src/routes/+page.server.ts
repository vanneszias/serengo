import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async (event) => {
	if (!event.locals.user) {
		// if not logged in, redirect to login page
		return redirect(302, '/login');
	}

	return {
		user: event.locals.user
	};
};
