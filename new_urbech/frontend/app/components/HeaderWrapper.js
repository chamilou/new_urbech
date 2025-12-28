import { Suspense } from "react";
import Header from "./Header";

export default function HeaderWrapper(props) {
  return (
    <Suspense fallback={null}>
      <Header {...props} />
    </Suspense>
  );
}
