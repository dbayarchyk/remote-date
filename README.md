# Remote Date

`remote-date` is a JavaScript library for synchronizing local time with a remote server. It provides a way to ensure that your application uses accurate and consistent time data, by leveraging remote time sources and accounting for network delays.

## Features

- Synchronizes local time with a remote server.
- Handles network delays and server processing times for accurate synchronization.
- Provides methods to get the current synchronized time and date.

## Installation

To install `remote-date`, use npm:

```bash
npm install remote-date
```

## Documentation

You can view the documentation [https://dbayarchyk.github.io/remote-date](https://dbayarchyk.github.io/remote-date/).

## Example

```js
import { RemoteDate } from "remote-date";

const remoteDate = new RemoteDate({
  remoteDate: new Date("2024-08-05T00:00Z"),
});

remoteDate.dateNow(); // 2024-08-05T00:00:00Z
// later in 1 second
remoteDate.dateNow(); // 2024-08-05T00:00:01Z
// later in 2 seconds
remoteDate.dateNow(); // 2024-08-05T00:00:03Z
// later in 7 seconds
remoteDate.dateNow(); // 2024-08-05T00:00:10Z
```

```js
import { RemoteDate, RemoteDateSynchronizer } from "remote-date";

const remoteDate = new RemoteDate();
const remoteDateSynchronizer = new RemoteDateSynchronizer({
  remoteDate: remoteDate,
  fetchRemote: async ({ signal }) => {
    const response = await fetch("https://api.example.com/remote-date", {
      signal,
    });
    const data = await response.json();

    return {
      remoteDate: new Date(data.remoteDate),
      serverStartProcessingMonotonicTimeInMs:
        data.serverStartProcessingMonotonicTimeInMs,
      serverEndProcessingMonotonicTimeInMs:
        data.serverEndProcessingMonotonicTimeInMs,
    };
  },
});

await remoteDateSynchronizer.syncWithRemote();

// ...

remoteDate.dateNow(); // 2024-08-05T00:00:00Z
// later in 1 second
remoteDate.dateNow(); // 2024-08-05T00:00:01Z
// later in 2 seconds
remoteDate.dateNow(); // 2024-08-05T00:00:03Z
// later in 7 seconds
remoteDate.dateNow(); // 2024-08-05T00:00:10Z
```

## References

- [Distributed Systems 3.2: Clock synchronisation](https://youtu.be/mAyW-4LeXZo?feature=shared)

## License

This project is licensed under the MIT License - see the LICENSE file for details.
