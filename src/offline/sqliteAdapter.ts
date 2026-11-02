export function adaptDatabase(native) {
  let queue = Promise.resolve();
  const serialize = (work) => {
    const operation = queue.then(work);
    queue = operation.catch(() => {});
    return operation;
  };
  const bind = (connection) => ({
    execAsync: (sql) => connection.execAsync(sql),
    runAsync: (sql, params = []) => connection.runAsync(sql, params),
    getFirstAsync: (sql, params = []) => connection.getFirstAsync(sql, params),
    getAllAsync: (sql, params = []) => connection.getAllAsync(sql, params),
  });
  return {
    native,
    ...bind(native),
    execAsync: (sql) => serialize(() => native.execAsync(sql)),
    runAsync: (sql, params = []) =>
      serialize(() => native.runAsync(sql, params)),
    transaction(work) {
      return serialize(async () => {
        let result;
        await native.withExclusiveTransactionAsync(async (tx) => {
          result = await work(bind(tx));
        });
        return result;
      });
    },
  };
}
