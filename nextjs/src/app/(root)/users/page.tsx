import { fetchUsers } from "../../actions/userActions";

export default async function UsersPage() {
  const users = await fetchUsers();

  return (
    <div>
      <h1>User Information</h1>
      {users.map((user, _) => {
        return (
          <div>
            <p>Username: {user.usernm}</p>
            <p>Email: {user.email}</p>
          </div>
        );
      })}
    </div>
  );
}
