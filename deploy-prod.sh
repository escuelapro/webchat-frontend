REST_API=https://escuela-chat-test.firebaseapp.com/ \
WS_URI=albertincx-telechat-1.glitch.me \
npm run build
if [[ ! -d "./public/build" ]] ; then
    mkdir ./public/build
fi
rm -r ./public/build/*
cp -r ./build/* ./public/build/.
firebase deploy --only hosting:escuela-chat-test

