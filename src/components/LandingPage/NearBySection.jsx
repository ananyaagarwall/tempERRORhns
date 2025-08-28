// import React from 'react';

// const NEARBY_PROPERTIES = [
//   {
//     img: '/palm.jpg',
//     title: 'Palm Residences',
//     location: 'Andheri West',
//     distance: '1.2 km away',
//     price: '₹1.8 Cr onwards',
//     type: 'Luxury Apartments'
//   },
//   {
//     img: '/garden.jpeg',
//     title: 'Garden View Heights',
//     location: 'Goregaon East',
//     distance: '2.5 km away',
//     price: '₹95 L onwards',
//     type: '2 & 3 BHK'
//   },
//   {
//     img: '/lodha.jpg',
//     title: 'Lodha Paradise',
//     location: 'Thane West',
//     distance: '3.8 km away',
//     price: '₹1.2 Cr onwards',
//     type: 'Premium Residences'
//   },
//   {
//     img: '/rustomujee.jpg',
//     title: 'Rustomjee Seasons',
//     location: 'Bandra East',
//     distance: '4.1 km away',
//     price: '₹2.5 Cr onwards',
//     type: 'Ultra Luxury'
//   },
//   {
//     img: '/presidental.jpeg',
//     title: 'Presidential Towers',
//     location: 'Worli',
//     distance: '5.0 km away',
//     price: '₹3.8 Cr onwards',
//     type: 'Sea View Apartments'
//   },
//   {
//     img: '/kalpa.jpg',
//     title: 'Kalpataru Heights',
//     location: 'Parel',
//     distance: '5.5 km away',
//     price: '₹1.9 Cr onwards',
//     type: 'Sky Villas'
//   }
// ];

// const NearBySection = () => (
//   <section className="landing-section bg-white py-10 px-3 md:px-6 lg:px-12">
//     <div className="max-w-7xl mx-auto">
//       <div className="text-center mb-8">
//         <h2 className="font-serif text-2xl md:text-3xl lg:text-4xl font-bold text-[#223A5F] tracking-tight">
//           Properties Near You
//         </h2>
//         <div className="w-16 h-1 bg-[#F9D87A] rounded mt-3 mx-auto transform transition-all duration-300 hover:scale-x-110" />
//         <p className="font-quicksand text-[#413E67] text-base md:text-lg mt-4 max-w-xl mx-auto">
//           Discover amazing properties in your neighborhood
//         </p>
//       </div>

//       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 ml-2 sm:ml-4 md:ml-8">
//         {NEARBY_PROPERTIES.map((property, index) => (
//           <div
//             key={index}
//             className="group bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
//           >
//             <div className="relative">
//               <img
//                 src={property.img}
//                 alt={property.title}
//                 className="w-full h-48 object-cover transition-transform duration-300 group-hover:scale-105"
//               />
//               <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full">
//                 <span className="text-sm font-medium text-[#223A5F]">{property.distance}</span>
//               </div>
//             </div>
//             <div className="p-4">
//               <h3 className="font-quicksand font-bold text-lg text-[#223A5F] mb-1">
//                 {property.title}
//               </h3>
//               <p className="text-[#413E67] text-sm mb-2">
//                 {property.location}
//               </p>
//               <div className="flex justify-between items-center mt-3">
//                 <span className="text-[#223A5F] font-medium text-base">
//                   {property.price}
//                 </span>
//                 <span className="bg-yellow-50 text-[#223A5F] text-xs px-3 py-1 rounded-full border border-yellow-100">
//                   {property.type}
//                 </span>
//               </div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   </section>
// );

// export default NearBySection; 