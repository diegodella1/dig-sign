/** Prefer Operate for generic post-login landing. */
export async function resolveAdminLoginLanding(returnTo: string): Promise<string> {
    if (returnTo !== '/admin' && returnTo !== '/admin/') {
        return returnTo;
    }

    return '/admin/operate';
}
