const PhotoCard = () => {
  const content = [
    {
      id: 1,
      name: "Tame Ontoro",
      image: "/bass.png",
      role: "Employee",
      department: "Engineering",
    },
  ];

  return (
    <div>
      {content.map((item) => (
        <div
          key={item.id}
          className="flex flex-col items-center p-3 bg-gray-200  text-purple-700 rounded-lg shadow-md h-auto w-60 m-4"
        >
          <img src={item.image} alt={item.name} className="p- rounded-4xl " />
          <p className="font-bold">{item.name}</p>
          <p className="font-bold">{item.role}</p>
          <p className="font-bold">{item.department}</p>
        </div>
      ))}
    </div>
  );
};

export default PhotoCard;
