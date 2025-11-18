export interface Usecase<Args, Res> {
	execute(args: Args): Promise<Res> | Res;
}
