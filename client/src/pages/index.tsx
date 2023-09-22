import Image from "next/image";
import { Inter } from "next/font/google";
import { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import logo from "../../public/images/kavach-logo-white.png";
import Head from "next/head";
import { BsEyeFill } from "react-icons/bs";
const inter = Inter({ subsets: ["latin"] });

export default function Home() {
	const [formData, setFormData] = useState(new FormData());
	const [response, setResponse] = useState("");
	const [imageResponse, setImageResponse] = useState("");
	const [imageData, setImageData] = useState<any>();
	const [location, setLocation] = useState<any>();
	const [socket, setSocket] = useState(null);
	const [ip, setIp] = useState("");
	const videoRef = useRef<any>(null);
	const canvasRef = useRef<any>(null);

	useEffect(() => {
		// Set up socket connection
		const socket: any = io("http://localhost:5000");
		setSocket(socket);

		// gets the coordinates of the client
		const options = {
			enableHighAccuracy: true,
			timeout: 5000,
			maximumAge: 0,
		};
		function success(pos: any) {
			const crd = pos.coords;
			setLocation({
				latitude: crd.latitude,
				longitude: crd.longitude,
			});
		}
		function error(err: any) {
			console.warn(`ERROR(${err.code}): ${err.message}`);
		}
		navigator.geolocation.getCurrentPosition(success, error, options);

		// Get webcam stream and set as video source
		navigator.mediaDevices
			.getUserMedia({ video: true, audio: false })
			.then((stream) => {
				if (videoRef.current != null) {
					videoRef.current.srcObject = stream;
					videoRef.current.play();
				}
			})
			.catch((err) => {
				console.error("Error accessing webcam:", err);
			});

		// Send video stream to backend every 100ms
		const sendVideoStream = setInterval(() => {
			// Draw video frame onto canvas
			const canvas = canvasRef.current;
			const ctx = canvas.getContext("2d");
			ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

			// Convert canvas data to image data URL
			const imageData = canvas.toDataURL("image/jpeg", 0.5);

			// Send image data URL to backend
			socket.emit("video_stream", imageData);
		}, 200);
		socket.on("result", (data: any) => {
			const response = JSON.parse(data);
			if (ip === "") setIp(response.ip);
			setResponse(response.result);
		});

		return () => {
			// Clean up socket connection and interval
			socket.disconnect();
			clearInterval(sendVideoStream);
		};
	}, []);

	function handleImageChange(event: any) {
		const imageFile = event.target.files[0];
		const reader = new FileReader();
		reader.onload = () => {
			const imageUrl = reader.result;
			setImageData(imageUrl);
		};
		reader.readAsDataURL(imageFile);
		const formdata = new FormData();
		formdata.append("image", imageFile);
		setFormData(formdata);
	}

	// image api
	async function handleSubmit(event: any) {
		event.preventDefault();

		// Add other form data to the formData object
		const response = await fetch("http://localhost:5000/upload-image", {
			method: "POST",
			body: formData,
		})
			.then((response) => {
				return response.json();
			})
			.catch((error) => {
				console.error(error);
			});
		if (response) {
			setImageResponse(response);
		}
	}
	return (
		<main className="overflow-hidden">
			<Head>
				<title>Third Eye - Advanced CCTV Analytics Solution</title>
			</Head>
			<video
				autoPlay
				muted
				loop
				id="myVideo"
				className="w-full fixed -z-10">
				<source
					src="https://freefrontend.com/assets/img/css-animated-backgrounds/shooting-star.mp4"
					type="video/mp4"
				/>
			</video>
			<main
				className={`grid grid-cols-2 h-screen gap-x-5  justify-between p-24 ${inter.className}`}>
				<nav className="fixed top-0 left-0 px-5 pt-5 z-10 w-full">
					<Image src={logo} alt="kavach_logo" width={80} />
				</nav>
				<section className="col-span-2 text-center mb-5">
					<h1 className="font-bold text-3xl p-2 text-blue-900 rounded bg-gradient-to-r from-orange-500 via-white to-green-500 justify-center flex">
						<p className="rotate-90">
							<BsEyeFill />
						</p>
						THIRD EYE
					</h1>
					<p>Advanced CCTV Analytics Solution</p>
				</section>
				<section className=" flex flex-col items-center bg-slate-800 min-h-[30rem] rounded">
					<h1 className="font-semibold text-2xl mt-5">Live Stream</h1>
					<div className="mt-2">Detected Response: {response}</div>
					<div className="">Client IP: {ip}</div>
					{location && (
						<div className="">
							Location: {location.latitude}:{location.longitude}
						</div>
					)}
					<div
						className="transform -scale-x-100"
						style={{
							position: "relative",
							width: "400px",
							height: "300px",
						}}>
						<video
							ref={videoRef}
							className="mt-2"
							style={{ position: "absolute", top: 0, left: 0 }}
						/>
						<canvas
							ref={canvasRef}
							width={400}
							height={300}
							style={{ display: "none" }}
						/>
					</div>
				</section>
				<section className=" flex flex-col items-center bg-slate-800 rounded">
					<h1 className="font-semibold text-2xl mt-5">
						Single Image File
					</h1>
					{imageResponse && (
						<>
							<div className="mt-2">
								Detected Response: {imageResponse}
							</div>
							<div className="">Client IP: {ip}</div>
						</>
					)}
					<div className="justify-center grid grid-cols-2 mt-2 border-[1px] items-center border-white p-2 rounded mx-20">
						<input type="file" onChange={handleImageChange} />
						<button
							className="bg-white text-slate-700 p-1 rounded"
							onClick={handleSubmit}>
							Check Violence
						</button>
					</div>
					<div className="flex col-span-2 justify-center">
						{imageData && (
							<Image
								className="col-span-2 mt-2"
								src={imageData}
								alt=""
								width={400}
								height={300}
							/>
						)}
					</div>
				</section>
			</main>
		</main>
	);
}
