import Book from '../models/Book.js';
import Issue from '../models/Issue.js';
import Reservation from '../models/Reservation.js';

// @desc    Get all books with search & filtering
// @route   GET /api/books
// @access  Public
export const getBooks = async (req, res) => {
  try {
    const { search, category, department, availability, publicationYear, language, format } = req.query;

    const query = {};

    // Search filter
    if (search) {
      const searchRegex = new RegExp(search, 'i');
      query.$or = [
        { title: searchRegex },
        { author: searchRegex },
        { ISBN: searchRegex },
        { category: searchRegex },
        { publisher: searchRegex },
        { department: searchRegex },
      ];
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (department && department !== 'All') {
      query.department = department;
    }

    if (language && language !== 'All') {
      query.language = language;
    }

    if (format && format !== 'All') {
      query.format = format;
    }

    if (publicationYear && publicationYear !== 'All') {
      query.publicationYear = Number(publicationYear);
    }

    if (availability === 'available') {
      query.availableCopies = { $gt: 0 };
    } else if (availability === 'unavailable') {
      query.availableCopies = 0;
    }

    const books = await Book.find(query).sort({ createdAt: -1 });

    return res.json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single book details
// @route   GET /api/books/:id
// @access  Public
export const getBookById = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    let userActiveIssue = null;
    let userActiveReservation = null;

    if (req.user) {
      userActiveIssue = await Issue.findOne({
        userId: req.user._id,
        bookId: book._id,
        status: { $in: ['ISSUED', 'OVERDUE'] },
      });

      userActiveReservation = await Reservation.findOne({
        userId: req.user._id,
        bookId: book._id,
        status: { $in: ['PENDING', 'APPROVED'] },
      });
    }

    return res.json({
      success: true,
      data: {
        ...book.toObject(),
        userActiveIssue: !!userActiveIssue,
        userActiveReservation: !!userActiveReservation,
      },
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new book
// @route   POST /api/books
// @access  Private (ADMIN, LIBRARIAN)
export const createBook = async (req, res) => {
  try {
    const {
      title,
      author,
      ISBN,
      publisher,
      category,
      department,
      description,
      coverImage,
      totalCopies,
      shelfNumber,
      rackNumber,
      publicationYear,
      language,
      format,
      digitalFile,
    } = req.body;

    if (!title || !author || !ISBN || !category) {
      return res.status(400).json({ success: false, message: 'Title, Author, ISBN, and Category are required' });
    }

    const existingBook = await Book.findOne({ ISBN: ISBN.trim() });
    if (existingBook) {
      return res.status(400).json({ success: false, message: 'Book with this ISBN already exists' });
    }

    const copies = Number(totalCopies) || 1;
    const available = Number(req.body.availableCopies ?? copies);

    const book = await Book.create({
      title,
      author,
      ISBN: ISBN.trim(),
      publisher: publisher || 'Academic Press',
      category,
      department: department || 'General Engineering',
      description: description || 'College course reference text.',
      coverImage: coverImage || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
      totalCopies: copies,
      availableCopies: Math.min(Math.max(available, 0), copies),
      shelfNumber: shelfNumber || 'A-01',
      rackNumber: rackNumber || 'R-01',
      publicationYear: Number(publicationYear) || 2024,
      language: language || 'English',
      format: format || 'PHYSICAL',
      digitalFile: digitalFile || '',
    });

    return res.status(201).json({
      success: true,
      message: 'Book created successfully',
      data: book,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a book
// @route   PUT /api/books/:id
// @access  Private (ADMIN, LIBRARIAN)
export const updateBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    const {
      title,
      author,
      ISBN,
      publisher,
      category,
      department,
      description,
      coverImage,
      totalCopies,
      availableCopies,
      shelfNumber,
      rackNumber,
      publicationYear,
      language,
      format,
      digitalFile,
    } = req.body;

    if (ISBN && ISBN !== book.ISBN) {
      const isbnExists = await Book.findOne({ ISBN: ISBN.trim() });
      if (isbnExists) {
        return res.status(400).json({ success: false, message: 'Another book with this ISBN already exists' });
      }
      book.ISBN = ISBN.trim();
    }

    if (totalCopies !== undefined) {
      const diff = Number(totalCopies) - book.totalCopies;
      book.totalCopies = Number(totalCopies);
      book.availableCopies = Math.max(0, book.availableCopies + diff);
    }

    if (availableCopies !== undefined) {
      book.availableCopies = Math.min(book.totalCopies, Math.max(0, Number(availableCopies)));
    }

    book.title = title || book.title;
    book.author = author || book.author;
    book.publisher = publisher !== undefined ? publisher : book.publisher;
    book.category = category || book.category;
    book.department = department || book.department;
    book.description = description !== undefined ? description : book.description;
    book.coverImage = coverImage || book.coverImage;
    book.shelfNumber = shelfNumber !== undefined ? shelfNumber : book.shelfNumber;
    book.rackNumber = rackNumber !== undefined ? rackNumber : book.rackNumber;
    book.publicationYear = publicationYear !== undefined ? Number(publicationYear) : book.publicationYear;
    book.language = language || book.language;
    book.format = format || book.format;
    book.digitalFile = digitalFile !== undefined ? digitalFile : book.digitalFile;

    const updatedBook = await book.save();

    return res.json({
      success: true,
      message: 'Book updated successfully',
      data: updatedBook,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a book
// @route   DELETE /api/books/:id
// @access  Private (ADMIN, LIBRARIAN)
export const deleteBook = async (req, res) => {
  try {
    const book = await Book.findById(req.params.id);
    if (!book) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }

    // Check if book has active issues
    const activeIssues = await Issue.countDocuments({
      bookId: book._id,
      status: { $in: ['ISSUED', 'OVERDUE'] },
    });

    if (activeIssues > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete book. It currently has ${activeIssues} active issue(s).`,
      });
    }

    await book.deleteOne();

    return res.json({
      success: true,
      message: 'Book deleted successfully',
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const buildFallbackBooks = (query = '') => {
  const q = String(query || '').toLowerCase();

  const bookGroups = {
    computer: [
      { googleId: 'fallback-cs-1', title: 'Clean Code', author: 'Robert C. Martin', ISBN: '9780132350884', publisher: 'Prentice Hall', category: 'Computer Science', description: 'A practical guide to writing clean, maintainable, and professional-grade software.', coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=400&q=80', publicationYear: 2008, language: 'English', pageCount: 464, previewLink: 'https://books.google.com/books?id=dwSfGQAACAAJ' },
      { googleId: 'fallback-cs-2', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', ISBN: '9780262033848', publisher: 'MIT Press', category: 'Computer Science', description: 'A comprehensive reference for algorithm design, analysis, and implementation.', coverImage: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=400&q=80', publicationYear: 2009, language: 'English', pageCount: 1292, previewLink: 'https://books.google.com/books?id=NLngYyWFl_YC' },
      { googleId: 'fallback-cs-3', title: 'Software Engineering', author: 'Ian Sommerville', ISBN: '9780133943030', publisher: 'Pearson', category: 'Software Engineering', description: 'A classic guide to the principles, processes, and practices of software engineering.', coverImage: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=400&q=80', publicationYear: 2015, language: 'English', pageCount: 790, previewLink: 'https://books.google.com/books?id=Y7_lCgAAQBAJ' },
      { googleId: 'fallback-cs-4', title: 'Operating System Concepts', author: 'Silberschatz', ISBN: '9781119456339', publisher: 'Wiley', category: 'Operating Systems', description: 'A standard text for learning scheduling, memory management, and OS design.', coverImage: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=400&q=80', publicationYear: 2020, language: 'English', pageCount: 1040, previewLink: 'https://books.google.com/books?id=H9HyDwAAQBAJ' },
      { googleId: 'fallback-cs-5', title: 'Data Structures and Algorithms', author: 'Narasimha Karumanchi', ISBN: '9788192107563', publisher: 'Careermonk', category: 'Computer Science', description: 'A practical handbook of data structures, algorithms, and interview-focused problem solving.', coverImage: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?auto=format&fit=crop&w=400&q=80', publicationYear: 2016, language: 'English', pageCount: 560, previewLink: 'https://books.google.com/books?id=5Wm1zQEACAAJ' },
      { googleId: 'fallback-cs-6', title: 'Computer Architecture', author: 'John L. Hennessy', ISBN: '9780123704900', publisher: 'Morgan Kaufmann', category: 'Computer Science', description: 'An engineering text on organization, instruction sets, and performance.', coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80', publicationYear: 2011, language: 'English', pageCount: 824, previewLink: 'https://books.google.com/books?id=2f9kAAAAQBAJ' },
      { googleId: 'fallback-cs-7', title: 'The Pragmatic Programmer', author: 'Andrew Hunt', ISBN: '9780201616224', publisher: 'Addison-Wesley', category: 'Software Engineering', description: 'A classic practical guide to software craftsmanship, team work, and building better products.', coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80', publicationYear: 1999, language: 'English', pageCount: 352, previewLink: 'https://books.google.com/books?id=5wBQEp6ruIAC' },
      { googleId: 'fallback-cs-8', title: 'Modern Operating Systems', author: 'Andrew S. Tanenbaum', ISBN: '9780133591620', publisher: 'Pearson', category: 'Operating Systems', description: 'An in-depth and modern look at operating system design and distributed systems.', coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80', publicationYear: 2014, language: 'English', pageCount: 1136, previewLink: 'https://books.google.com/books?id=LuD1EAAAQBAJ' },
    ],
    database: [
      { googleId: 'fallback-db-1', title: 'Database System Concepts', author: 'Abraham Silberschatz', ISBN: '9780078022159', publisher: 'McGraw Hill', category: 'Database Management', description: 'Essential concepts and design principles for database systems and querying.', coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=400&q=80', publicationYear: 2014, language: 'English', pageCount: 1376, previewLink: 'https://books.google.com/books?id=3ikatAEACAAJ' },
      { googleId: 'fallback-db-2', title: 'Fundamentals of Database Systems', author: 'Elmasri', ISBN: '9780133970777', publisher: 'Pearson', category: 'Database Management', description: 'Explores modeling, relational design, SQL, and practical database theory.', coverImage: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=400&q=80', publicationYear: 2015, language: 'English', pageCount: 1160, previewLink: 'https://books.google.com/books?id=7wH4ngEACAAJ' },
      { googleId: 'fallback-db-3', title: 'SQL in a Nutshell', author: 'Kevin Kline', ISBN: '9781491977648', publisher: 'O’Reilly', category: 'Database Management', description: 'A quick and practical guide to SQL syntax, operations, and database interaction.', coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80', publicationYear: 2019, language: 'English', pageCount: 540, previewLink: 'https://books.google.com/books?id=JXWvDwAAQBAJ' },
      { googleId: 'fallback-db-4', title: 'Database Design for Mere Mortals', author: 'Michael Hernandez', ISBN: '9780201752841', publisher: 'Addison-Wesley', category: 'Database Management', description: 'A practical approach to designing and maintaining relational databases.', coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80', publicationYear: 2003, language: 'English', pageCount: 660, previewLink: 'https://books.google.com/books?id=8Q8mAQAAIAAJ' },
      { googleId: 'fallback-db-5', title: 'High Performance MySQL', author: 'Baron Schwartz', ISBN: '9781449314286', publisher: 'O’Reilly', category: 'Database Management', description: 'A practical book focused on tuning, architecture, and scalable relational database systems.', coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80', publicationYear: 2012, language: 'English', pageCount: 720, previewLink: 'https://books.google.com/books?id=xNq3xwEACAAJ' },
      { googleId: 'fallback-db-6', title: 'Learning SQL', author: 'Alan Beaulieu', ISBN: '9780596520830', publisher: 'O’Reilly', category: 'Database Management', description: 'A beginner-friendly SQL guide covering queries, joins, and database design patterns.', coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=400&q=80', publicationYear: 2009, language: 'English', pageCount: 420, previewLink: 'https://books.google.com/books?id=7xIuDwAAQBAJ' },
      { googleId: 'fallback-db-7', title: 'MongoDB: The Definitive Guide', author: 'Kristina Chodorow', ISBN: '9781449344689', publisher: 'O’Reilly', category: 'Database Management', description: 'Practical guidance for developing and scaling document-based applications with MongoDB.', coverImage: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=400&q=80', publicationYear: 2013, language: 'English', pageCount: 488, previewLink: 'https://books.google.com/books?id=pj0vAAAAQBAJ' },
      { googleId: 'fallback-db-8', title: 'Database Internals', author: 'Alex Petrov', ISBN: '9781492040347', publisher: 'O’Reilly', category: 'Database Management', description: 'A deep dive into storage engines, indexes, and internal behavior of modern databases.', coverImage: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=400&q=80', publicationYear: 2019, language: 'English', pageCount: 515, previewLink: 'https://books.google.com/books?id=asF-DwAAQBAJ' },
    ],
    ai: [
      { googleId: 'fallback-ai-1', title: 'Machine Learning', author: 'Tom M. Mitchell', ISBN: '9780070428072', publisher: 'McGraw Hill', category: 'Artificial Intelligence', description: 'A foundational guide to machine learning algorithms, models, and evaluation.', coverImage: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=400&q=80', publicationYear: 1997, language: 'English', pageCount: 420, previewLink: 'https://books.google.com/books?id=EoYBngEACAAJ' },
      { googleId: 'fallback-ai-2', title: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell', ISBN: '9780134610993', publisher: 'Pearson', category: 'Artificial Intelligence', description: 'A widely cited reference for AI concepts, reasoning, and learning systems.', coverImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80', publicationYear: 2020, language: 'English', pageCount: 1152, previewLink: 'https://books.google.com/books?id=7s7vDwAAQBAJ' },
      { googleId: 'fallback-ai-3', title: 'Deep Learning', author: 'Ian Goodfellow', ISBN: '9780262035613', publisher: 'MIT Press', category: 'Artificial Intelligence', description: 'A comprehensive, modern treatment of deep learning methods and theory.', coverImage: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=400&q=80', publicationYear: 2016, language: 'English', pageCount: 800, previewLink: 'https://books.google.com/books?id=Np9SDQAAQBAJ' },
      { googleId: 'fallback-ai-4', title: 'Pattern Recognition and Machine Learning', author: 'Christopher Bishop', ISBN: '9780387310732', publisher: 'Springer', category: 'Artificial Intelligence', description: 'A major text bridging statistics, optimization, and probabilistic modeling.', coverImage: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=400&q=80', publicationYear: 2006, language: 'English', pageCount: 738, previewLink: 'https://books.google.com/books?id=8n3uAAAAMAAJ' },
      { googleId: 'fallback-ai-5', title: 'Hands-On Machine Learning', author: 'Aurélien Géron', ISBN: '9781098122461', publisher: 'O’Reilly', category: 'Artificial Intelligence', description: 'A hands-on and highly practical guide to ML pipelines and model deployment.', coverImage: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=400&q=80', publicationYear: 2022, language: 'English', pageCount: 850, previewLink: 'https://books.google.com/books?id=8V1kEAAAQBAJ' },
      { googleId: 'fallback-ai-6', title: 'Probabilistic Machine Learning', author: 'Kevin Murphy', ISBN: '9780262046824', publisher: 'MIT Press', category: 'Artificial Intelligence', description: 'A modern probabilistic treatment of machine learning concepts and theory.', coverImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80', publicationYear: 2022, language: 'English', pageCount: 1100, previewLink: 'https://books.google.com/books?id=2YoGEAAAQBAJ' },
      { googleId: 'fallback-ai-7', title: 'Introduction to Statistical Learning', author: 'Gareth James', ISBN: '9781461471370', publisher: 'Springer', category: 'Data Science', description: 'A practical statistical learning resource blending theory and application.', coverImage: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=400&q=80', publicationYear: 2013, language: 'English', pageCount: 440, previewLink: 'https://books.google.com/books?id=9mMZCwAAQBAJ' },
      { googleId: 'fallback-ai-8', title: 'Neural Networks and Deep Learning', author: 'Michael Nielsen', ISBN: '9781503761092', publisher: 'Determination Press', category: 'Artificial Intelligence', description: 'An accessible and intuitive explanation of neural networks and deep learning.', coverImage: 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?auto=format&fit=crop&w=400&q=80', publicationYear: 2015, language: 'English', pageCount: 260, previewLink: 'https://books.google.com/books?id=UE9EAwAAQBAJ' },
    ],
    networking: [
      { googleId: 'fallback-net-1', title: 'Computer Networks', author: 'Andrew S. Tanenbaum', ISBN: '9780132126953', publisher: 'Pearson', category: 'Networking', description: 'A foundational textbook covering networking models, protocols, and distributed systems.', coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80', publicationYear: 2010, language: 'English', pageCount: 960, previewLink: 'https://books.google.com/books?id=sW7wOQEACAAJ' },
      { googleId: 'fallback-net-2', title: 'Data Communications and Networking', author: 'Behrouz Forouzan', ISBN: '9780073376226', publisher: 'McGraw Hill', category: 'Networking', description: 'A practical communications resource for protocols, media, and network design.', coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80', publicationYear: 2012, language: 'English', pageCount: 1120, previewLink: 'https://books.google.com/books?id=efQZngEACAAJ' },
      { googleId: 'fallback-net-3', title: 'Computer Networking: A Top-Down Approach', author: 'James Kurose', ISBN: '9780133594140', publisher: 'Pearson', category: 'Networking', description: 'A top-down treatment of protocols, architecture, and real networking systems.', coverImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80', publicationYear: 2016, language: 'English', pageCount: 872, previewLink: 'https://books.google.com/books?id=9Z0vDwAAQBAJ' },
      { googleId: 'fallback-net-4', title: 'TCP/IP Illustrated', author: 'W. Richard Stevens', ISBN: '9780201633467', publisher: 'Addison-Wesley', category: 'Networking', description: 'A detailed reference on the internet protocol suite and network internals.', coverImage: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=400&q=80', publicationYear: 1994, language: 'English', pageCount: 825, previewLink: 'https://books.google.com/books?id=HJl6QgAACAAJ' },
      { googleId: 'fallback-net-5', title: 'Computer Networking: A Top-Down Approach', author: 'Keith Ross', ISBN: '9781292133206', publisher: 'Pearson', category: 'Networking', description: 'A practical exploration of internet protocols, network applications, and design.', coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80', publicationYear: 2021, language: 'English', pageCount: 900, previewLink: 'https://books.google.com/books?id=s4bQzQEACAAJ' },
      { googleId: 'fallback-net-6', title: 'Internetworking with TCP/IP', author: 'Douglas Comer', ISBN: '9780136061274', publisher: 'Pearson', category: 'Networking', description: 'Fundamental coverage of the TCP/IP protocol stack and internetworking design.', coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80', publicationYear: 2014, language: 'English', pageCount: 1184, previewLink: 'https://books.google.com/books?id=0Uk8DwAAQBAJ' },
      { googleId: 'fallback-net-7', title: 'CCNA Routing and Switching', author: 'Todd Lammle', ISBN: '9781119288684', publisher: 'Wiley', category: 'Networking', description: 'A complete guide to routing, switching, and data center networking fundamentals.', coverImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80', publicationYear: 2021, language: 'English', pageCount: 1088, previewLink: 'https://books.google.com/books?id=0bJ6zgEACAAJ' },
      { googleId: 'fallback-net-8', title: 'The Practice of Network Security Monitoring', author: 'Richard Bejtlich', ISBN: '9780133374082', publisher: 'Pearson', category: 'Cybersecurity', description: 'A resource for detecting and analyzing security events across networks and systems.', coverImage: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=400&q=80', publicationYear: 2013, language: 'English', pageCount: 576, previewLink: 'https://books.google.com/books?id=3xg8DwAAQBAJ' },
    ],
    electronics: [
      { googleId: 'fallback-elec-1', title: 'Digital Design', author: 'M. Morris Mano', ISBN: '9780132129374', publisher: 'Pearson', category: 'Electronics', description: 'A classic text on digital logic design, circuits, and systems.', coverImage: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=400&q=80', publicationYear: 2013, language: 'English', pageCount: 784, previewLink: 'https://books.google.com/books?id=AKQkDwAAQBAJ' },
      { googleId: 'fallback-elec-2', title: 'Fundamentals of Electric Circuits', author: 'Charles K. Alexander', ISBN: '9780078028229', publisher: 'McGraw Hill', category: 'Electrical Engineering', description: 'Covers circuit analysis and engineering fundamentals used across electrical fields.', coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80', publicationYear: 2017, language: 'English', pageCount: 880, previewLink: 'https://books.google.com/books?id=0pzRngEACAAJ' },
      { googleId: 'fallback-elec-3', title: 'Electronic Devices', author: 'Thomas L. Floyd', ISBN: '9780132549868', publisher: 'Pearson', category: 'Electronics', description: 'An accessible electronics reference for semiconductors and device operation.', coverImage: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=400&q=80', publicationYear: 2017, language: 'English', pageCount: 912, previewLink: 'https://books.google.com/books?id=Kcy3DwAAQBAJ' },
      { googleId: 'fallback-elec-4', title: 'Digital Signal Processing', author: 'John G. Proakis', ISBN: '9780131873742', publisher: 'Pearson', category: 'Electronics', description: 'Fundamental concepts in digital signal processing for communication and control.', coverImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80', publicationYear: 2006, language: 'English', pageCount: 1008, previewLink: 'https://books.google.com/books?id=xagvAQAAIAAJ' },
      { googleId: 'fallback-elec-5', title: 'Microelectronic Circuits', author: 'Sedra & Smith', ISBN: '9780199339136', publisher: 'Oxford', category: 'Electronics', description: 'A standard text on analog and digital integrated circuits and microelectronics.', coverImage: 'https://images.unsplash.com/photo-1515879218367-8466d910aaa4?auto=format&fit=crop&w=400&q=80', publicationYear: 2015, language: 'English', pageCount: 1232, previewLink: 'https://books.google.com/books?id=2IDAxQEACAAJ' },
      { googleId: 'fallback-elec-6', title: 'Principles of Electronics', author: 'V. K. Mehta', ISBN: '9788121924504', publisher: 'S. Chand', category: 'Electronics', description: 'A broad and clear introduction to semiconductor devices, circuits, and electronics.', coverImage: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=400&q=80', publicationYear: 2008, language: 'English', pageCount: 940, previewLink: 'https://books.google.com/books?id=7Yc5AQAAIAAJ' },
      { googleId: 'fallback-elec-7', title: 'Signals and Systems', author: 'Alan V. Oppenheim', ISBN: '9780138147570', publisher: 'Pearson', category: 'Electronics', description: 'Core theory and analysis for continuous-time and discrete-time signal processing.', coverImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=400&q=80', publicationYear: 2014, language: 'English', pageCount: 912, previewLink: 'https://books.google.com/books?id=4j4QzgEACAAJ' },
      { googleId: 'fallback-elec-8', title: 'Electronic Principles', author: 'Albert Malvino', ISBN: '9780073373881', publisher: 'McGraw Hill', category: 'Electronics', description: 'A practical introduction to electronic principles and circuit applications.', coverImage: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=400&q=80', publicationYear: 2016, language: 'English', pageCount: 820, previewLink: 'https://books.google.com/books?id=9FPltAEACAAJ' },
    ],
    mathematics: [
      { googleId: 'fallback-math-1', title: 'Engineering Mathematics', author: 'K. A. Stroud', ISBN: '9781137031208', publisher: 'Palgrave', category: 'Mathematics', description: 'Practical mathematics for engineering students across calculus and differential equations.', coverImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=400&q=80', publicationYear: 2013, language: 'English', pageCount: 760, previewLink: 'https://books.google.com/books?id=XYv19gEACAAJ' },
      { googleId: 'fallback-math-2', title: 'Discrete Mathematics', author: 'Ralph P. Grimaldi', ISBN: '9780134683713', publisher: 'Pearson', category: 'Mathematics', description: 'A clear and rigorous introduction to discrete math with logic and combinatorics.', coverImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=400&q=80', publicationYear: 2017, language: 'English', pageCount: 768, previewLink: 'https://books.google.com/books?id=J1lnDwAAQBAJ' },
      { googleId: 'fallback-math-3', title: 'Calculus', author: 'James Stewart', ISBN: '9781305480513', publisher: 'Cengage', category: 'Mathematics', description: 'A widely used calculus reference covering derivatives, integrals, and application fields.', coverImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=400&q=80', publicationYear: 2020, language: 'English', pageCount: 1100, previewLink: 'https://books.google.com/books?id=ZzR7DwAAQBAJ' },
      { googleId: 'fallback-math-4', title: 'Advanced Engineering Mathematics', author: 'Erwin Kreyszig', ISBN: '9780470458365', publisher: 'Wiley', category: 'Mathematics', description: 'A standard engineering mathematics text for advanced analytical methods.', coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80', publicationYear: 2011, language: 'English', pageCount: 1200, previewLink: 'https://books.google.com/books?id=Fsh4QgAACAAJ' },
      { googleId: 'fallback-math-5', title: 'Linear Algebra and Its Applications', author: 'Gilbert Strang', ISBN: '9780030105678', publisher: 'Brooks/Cole', category: 'Mathematics', description: 'A classic introduction to matrix methods and linear algebra principles.', coverImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=400&q=80', publicationYear: 2006, language: 'English', pageCount: 480, previewLink: 'https://books.google.com/books?id=I-5gQgAACAAJ' },
      { googleId: 'fallback-math-6', title: 'Probability and Statistics', author: 'Murray R. Spiegel', ISBN: '9780070602207', publisher: 'McGraw Hill', category: 'Mathematics', description: 'An accessible text for probability theory and introductory statistics.', coverImage: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?auto=format&fit=crop&w=400&q=80', publicationYear: 2000, language: 'English', pageCount: 500, previewLink: 'https://books.google.com/books?id=3sD0xgEACAAJ' },
      { googleId: 'fallback-math-7', title: 'Differential Equations', author: 'Dennis Zill', ISBN: '9781305965795', publisher: 'Cengage', category: 'Mathematics', description: 'An applied introduction to differential equations and mathematical modeling.', coverImage: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=400&q=80', publicationYear: 2017, language: 'English', pageCount: 472, previewLink: 'https://books.google.com/books?id=dS1MtwEACAAJ' },
      { googleId: 'fallback-math-8', title: 'Numerical Methods for Engineers', author: 'Steven Chapra', ISBN: '9780073385898', publisher: 'McGraw Hill', category: 'Mathematics', description: 'A practical engineering-focused treatment of numerical computation methods.', coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80', publicationYear: 2015, language: 'English', pageCount: 920, previewLink: 'https://books.google.com/books?id=Yf9jQgAACAAJ' },
    ],
    civil: [
      { googleId: 'fallback-civil-1', title: 'Structural Analysis', author: 'R. C. Hibbeler', ISBN: '9780134610672', publisher: 'Pearson', category: 'Civil Engineering', description: 'A standard civil engineering book on force methods, matrix analysis, and structural behavior.', coverImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80', publicationYear: 2016, language: 'English', pageCount: 848, previewLink: 'https://books.google.com/books?id=CDt2zQEACAAJ' },
      { googleId: 'fallback-civil-2', title: 'Engineering Mechanics', author: 'Russell Hibbeler', ISBN: '9780132915729', publisher: 'Pearson', category: 'Mechanical Engineering', description: 'A practical resource for mechanics, force systems, and equilibrium.', coverImage: 'https://images.unsplash.com/photo-1520367740639-77d0d3b82c17?auto=format&fit=crop&w=400&q=80', publicationYear: 2016, language: 'English', pageCount: 1040, previewLink: 'https://books.google.com/books?id=fZxHygEACAAJ' },
      { googleId: 'fallback-civil-3', title: 'Design of Concrete Structures', author: 'Arthur H. Nilson', ISBN: '9780071267775', publisher: 'McGraw Hill', category: 'Civil Engineering', description: 'A leading resource on reinforced concrete and structural design practice.', coverImage: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=400&q=80', publicationYear: 2015, language: 'English', pageCount: 980, previewLink: 'https://books.google.com/books?id=1ZQ0vgAACAAJ' },
      { googleId: 'fallback-civil-4', title: 'Geotechnical Engineering', author: 'Braja M. Das', ISBN: '9781305970938', publisher: 'Cengage', category: 'Civil Engineering', description: 'A core text on soils, foundations, and geotechnical design principles.', coverImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80', publicationYear: 2017, language: 'English', pageCount: 740, previewLink: 'https://books.google.com/books?id=4qnTwAEACAAJ' },
      { googleId: 'fallback-civil-5', title: 'Surveying', author: 'M. M. B. M. Basak', ISBN: '9788174093083', publisher: 'Tata McGraw-Hill', category: 'Civil Engineering', description: 'A practical treatment of land surveying, control networks, and project layout.', coverImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80', publicationYear: 2017, language: 'English', pageCount: 600, previewLink: 'https://books.google.com/books?id=Hhb_zwEACAAJ' },
      { googleId: 'fallback-civil-6', title: 'Principles of Foundation Engineering', author: 'Braja Das', ISBN: '9781305081550', publisher: 'Cengage', category: 'Civil Engineering', description: 'A core resource for foundations, soil mechanics, and structural support systems.', coverImage: 'https://images.unsplash.com/photo-1520367740639-77d0d3b82c17?auto=format&fit=crop&w=400&q=80', publicationYear: 2018, language: 'English', pageCount: 740, previewLink: 'https://books.google.com/books?id=jP02vgAACAAJ' },
      { googleId: 'fallback-civil-7', title: 'Hydraulics and Fluid Mechanics', author: 'P. M. Modi', ISBN: '9788121904607', publisher: 'Standard Publishers', category: 'Civil Engineering', description: 'A practical reference for hydraulic systems and fluid mechanics in civil works.', coverImage: 'https://images.unsplash.com/photo-1520367740639-77d0d3b82c17?auto=format&fit=crop&w=400&q=80', publicationYear: 2010, language: 'English', pageCount: 760, previewLink: 'https://books.google.com/books?id=bcG0oAEACAAJ' },
      { googleId: 'fallback-civil-8', title: 'Highway Engineering', author: 'Khanna & Justo', ISBN: '9788174092208', publisher: 'Nem Chand', category: 'Civil Engineering', description: 'A technical guide to pavement design, materials, and transport infrastructure.', coverImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80', publicationYear: 2015, language: 'English', pageCount: 700, previewLink: 'https://books.google.com/books?id=VHZPngEACAAJ' },
    ],
    mechanical: [
      { googleId: 'fallback-mech-1', title: 'Thermodynamics', author: 'Yunus A. Çengel', ISBN: '9780073398174', publisher: 'McGraw Hill', category: 'Mechanical Engineering', description: 'A classic engineering resource on thermodynamic systems and energy transfer.', coverImage: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=400&q=80', publicationYear: 2014, language: 'English', pageCount: 996, previewLink: 'https://books.google.com/books?id=lsNhjgEACAAJ' },
      { googleId: 'fallback-mech-2', title: 'Fluid Mechanics', author: 'Frank M. White', ISBN: '9780071284219', publisher: 'McGraw Hill', category: 'Mechanical Engineering', description: 'A core reference for fluid statics, dynamics, and engineering applications.', coverImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80', publicationYear: 2011, language: 'English', pageCount: 895, previewLink: 'https://books.google.com/books?id=5M0zngEACAAJ' },
      { googleId: 'fallback-mech-3', title: 'Machine Design', author: 'Robert L. Norton', ISBN: '9780073529356', publisher: 'McGraw Hill', category: 'Mechanical Engineering', description: 'Design fundamentals for mechanical elements and machines in realistic settings.', coverImage: 'https://images.unsplash.com/photo-1520367740639-77d0d3b82c17?auto=format&fit=crop&w=400&q=80', publicationYear: 2012, language: 'English', pageCount: 890, previewLink: 'https://books.google.com/books?id=Q4zBngEACAAJ' },
      { googleId: 'fallback-mech-4', title: 'Engineering Mechanics', author: 'Russell Hibbeler', ISBN: '9780132915729', publisher: 'Pearson', category: 'Mechanical Engineering', description: 'A practical resource for mechanics, force systems, and equilibrium.', coverImage: 'https://images.unsplash.com/photo-1520367740639-77d0d3b82c17?auto=format&fit=crop&w=400&q=80', publicationYear: 2016, language: 'English', pageCount: 1040, previewLink: 'https://books.google.com/books?id=fZxHygEACAAJ' },
      { googleId: 'fallback-mech-5', title: 'Mechanical Vibrations', author: 'Singiresu Rao', ISBN: '9780134361307', publisher: 'Pearson', category: 'Mechanical Engineering', description: 'A core text on vibration analysis, modeling, and dynamic systems in mechanical design.', coverImage: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=400&q=80', publicationYear: 2017, language: 'English', pageCount: 920, previewLink: 'https://books.google.com/books?id=JmF8DwAAQBAJ' },
      { googleId: 'fallback-mech-6', title: 'Heat Transfer', author: 'J. P. Holman', ISBN: '9780070634536', publisher: 'McGraw Hill', category: 'Mechanical Engineering', description: 'A key reference for the study and application of heat transfer processes.', coverImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80', publicationYear: 2009, language: 'English', pageCount: 800, previewLink: 'https://books.google.com/books?id=94J7QgAACAAJ' },
      { googleId: 'fallback-mech-7', title: 'Manufacturing Engineering and Technology', author: 'Serope Kalpakjian', ISBN: '9780133128741', publisher: 'Pearson', category: 'Mechanical Engineering', description: 'A comprehensive overview of manufacturing processes, design, and industrial systems.', coverImage: 'https://images.unsplash.com/photo-1520367740639-77d0d3b82c17?auto=format&fit=crop&w=400&q=80', publicationYear: 2013, language: 'English', pageCount: 1200, previewLink: 'https://books.google.com/books?id=ywB8jgEACAAJ' },
      { googleId: 'fallback-mech-8', title: 'Shigley’s Mechanical Engineering Design', author: 'Richard Budynas', ISBN: '9780073398204', publisher: 'McGraw Hill', category: 'Mechanical Engineering', description: 'A widely used design handbook for machine elements, loads, and durability.', coverImage: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=400&q=80', publicationYear: 2015, language: 'English', pageCount: 1100, previewLink: 'https://books.google.com/books?id=wQM8DwAAQBAJ' },
    ],
    cyber: [
      { googleId: 'fallback-cyber-1', title: 'Computer Security Principles and Practice', author: 'William Stallings', ISBN: '9780133773927', publisher: 'Pearson', category: 'Cybersecurity', description: 'A practical cybersecurity reference on cryptography and defense strategies.', coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80', publicationYear: 2018, language: 'English', pageCount: 872, previewLink: 'https://books.google.com/books?id=k2QmngEACAAJ' },
      { googleId: 'fallback-cyber-2', title: 'The Web Application Hacker’s Handbook', author: 'Marcus Pinto', ISBN: '9781118026472', publisher: 'Wiley', category: 'Cybersecurity', description: 'A security-oriented treatment of application testing, exploitation, and defense.', coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80', publicationYear: 2011, language: 'English', pageCount: 960, previewLink: 'https://books.google.com/books?id=t2kZwEACAAJ' },
      { googleId: 'fallback-cyber-3', title: 'Applied Cryptography', author: 'Bruce Schneier', ISBN: '9780471117094', publisher: 'Wiley', category: 'Cybersecurity', description: 'A classic book on encryption systems and practical security design.', coverImage: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=400&q=80', publicationYear: 1996, language: 'English', pageCount: 758, previewLink: 'https://books.google.com/books?id=4aM_AwAAQBAJ' },
      { googleId: 'fallback-cyber-4', title: 'Network Security Essentials', author: 'William Stallings', ISBN: '9780134527338', publisher: 'Pearson', category: 'Cybersecurity', description: 'A practical overview of firewalls, intrusion detection, and secure networking.', coverImage: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=400&q=80', publicationYear: 2017, language: 'English', pageCount: 520, previewLink: 'https://books.google.com/books?id=aG6wswEACAAJ' },
      { googleId: 'fallback-cyber-5', title: 'The Tangled Web', author: 'Michal Zalewski', ISBN: '9781593273881', publisher: 'No Starch Press', category: 'Cybersecurity', description: 'A deep dive into browser security, web attack surfaces, and exploitation paths.', coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80', publicationYear: 2011, language: 'English', pageCount: 456, previewLink: 'https://books.google.com/books?id=2B_M0mYfR2kC' },
      { googleId: 'fallback-cyber-6', title: 'Practical Malware Analysis', author: 'Sikorski & Honig', ISBN: '9781593272907', publisher: 'No Starch Press', category: 'Cybersecurity', description: 'A guide to reverse engineering and analyzing real-world malware samples.', coverImage: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=400&q=80', publicationYear: 2012, language: 'English', pageCount: 832, previewLink: 'https://books.google.com/books?id=9l9n5V5ftk8C' },
      { googleId: 'fallback-cyber-7', title: 'Metasploit: The Penetration Tester’s Guide', author: 'David Kennedy', ISBN: '9781593272884', publisher: 'No Starch Press', category: 'Cybersecurity', description: 'A hands-on guide to penetration testing and exploitation workflows.', coverImage: 'https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=400&q=80', publicationYear: 2011, language: 'English', pageCount: 520, previewLink: 'https://books.google.com/books?id=2v-o9S2_tQAC' },
      { googleId: 'fallback-cyber-8', title: 'Blue Team Handbook', author: 'Don Murdoch', ISBN: '9781467585695', publisher: 'CreateSpace', category: 'Cybersecurity', description: 'A practical security operations handbook for defenders and incident response teams.', coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80', publicationYear: 2014, language: 'English', pageCount: 420, previewLink: 'https://books.google.com/books?id=t0RzAwAAQBAJ' },
    ],
    cloud: [
      { googleId: 'fallback-cloud-1', title: 'Cloud Computing', author: 'Thomas Erl', ISBN: '9780133387528', publisher: 'Pearson', category: 'Cloud Computing', description: 'A practical framework covering cloud concepts, architecture, and service models.', coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80', publicationYear: 2013, language: 'English', pageCount: 580, previewLink: 'https://books.google.com/books?id=Z3pTvgAACAAJ' },
      { googleId: 'fallback-cloud-2', title: 'Architecting the Cloud', author: 'Michael J. Kavis', ISBN: '9781118617618', publisher: 'Wiley', category: 'Cloud Computing', description: 'A guide to designing resilient, scalable cloud-native systems and solutions.', coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80', publicationYear: 2014, language: 'English', pageCount: 500, previewLink: 'https://books.google.com/books?id=y9NUAQAAQBAJ' },
      { googleId: 'fallback-cloud-3', title: 'AWS Certified Solutions Architect', author: 'Ben Piper', ISBN: '9781119553951', publisher: 'Wiley', category: 'Cloud Computing', description: 'A practical cloud certification handbook for designing AWS solutions.', coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80', publicationYear: 2019, language: 'English', pageCount: 768, previewLink: 'https://books.google.com/books?id=0Yc3DwAAQBAJ' },
      { googleId: 'fallback-cloud-4', title: 'Cloud Native Patterns', author: 'Cornelia Davis', ISBN: '9781617294297', publisher: 'Manning', category: 'Cloud Computing', description: 'A design guide for building effective cloud-native applications and services.', coverImage: 'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=400&q=80', publicationYear: 2019, language: 'English', pageCount: 280, previewLink: 'https://books.google.com/books?id=Q8iYDwAAQBAJ' },
      { googleId: 'fallback-cloud-5', title: 'Designing Data-Intensive Applications', author: 'Martin Kleppmann', ISBN: '9781449373320', publisher: 'O’Reilly', category: 'Distributed Systems', description: 'A landmark reference for scalable data systems, architecture, and cloud-ready design.', coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80', publicationYear: 2017, language: 'English', pageCount: 616, previewLink: 'https://books.google.com/books?id=RlFFDwAAQBAJ' },
      { googleId: 'fallback-cloud-6', title: 'Kubernetes Up & Running', author: 'Brendan Burns', ISBN: '9781098110208', publisher: 'O’Reilly', category: 'Cloud Computing', description: 'A practical introduction to Kubernetes, orchestration, and modern deployment pipelines.', coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80', publicationYear: 2020, language: 'English', pageCount: 520, previewLink: 'https://books.google.com/books?id=Yz1LEAAAQBAJ' },
      { googleId: 'fallback-cloud-7', title: 'Terraform: Up & Running', author: 'Yevgeniy Brikman', ISBN: '9781098116743', publisher: 'O’Reilly', category: 'Cloud Computing', description: 'A hands-on guide to infrastructure as code and cloud provisioning with Terraform.', coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80', publicationYear: 2022, language: 'English', pageCount: 448, previewLink: 'https://books.google.com/books?id=I4bAzQEACAAJ' },
      { googleId: 'fallback-cloud-8', title: 'Google Cloud Platform in Action', author: 'J. S. J. H. D. R', ISBN: '9781617294726', publisher: 'Manning', category: 'Cloud Computing', description: 'An applied guide for architects and engineers designing for popular cloud platforms.', coverImage: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=400&q=80', publicationYear: 2022, language: 'English', pageCount: 360, previewLink: 'https://books.google.com/books?id=xX1FzwEACAAJ' },
    ],
    default: [
      { googleId: 'fallback-default-1', title: 'Clean Code', author: 'Robert C. Martin', ISBN: '9780132350884', publisher: 'Prentice Hall', category: 'Computer Science', description: 'A practical guide to writing clean, maintainable, and professional-grade software.', coverImage: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=400&q=80', publicationYear: 2008, language: 'English', pageCount: 464, previewLink: 'https://books.google.com/books?id=dwSfGQAACAAJ' },
      { googleId: 'fallback-default-2', title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', ISBN: '9780262033848', publisher: 'MIT Press', category: 'Computer Science', description: 'A comprehensive reference for algorithm design and implementation.', coverImage: 'https://images.unsplash.com/photo-1521587760476-6c12a4b040da?auto=format&fit=crop&w=400&q=80', publicationYear: 2009, language: 'English', pageCount: 1292, previewLink: 'https://books.google.com/books?id=NLngYyWFl_YC' },
      { googleId: 'fallback-default-3', title: 'Database System Concepts', author: 'Abraham Silberschatz', ISBN: '9780078022159', publisher: 'McGraw Hill', category: 'Database Management', description: 'Essential concepts and design principles for database systems.', coverImage: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=400&q=80', publicationYear: 2014, language: 'English', pageCount: 1376, previewLink: 'https://books.google.com/books?id=3ikatAEACAAJ' },
      { googleId: 'fallback-default-4', title: 'Computer Networks', author: 'Andrew S. Tanenbaum', ISBN: '9780132126953', publisher: 'Pearson', category: 'Networking', description: 'A foundational textbook covering networking models and protocols.', coverImage: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=400&q=80', publicationYear: 2010, language: 'English', pageCount: 960, previewLink: 'https://books.google.com/books?id=sW7wOQEACAAJ' },
      { googleId: 'fallback-default-5', title: 'Machine Learning', author: 'Tom M. Mitchell', ISBN: '9780070428072', publisher: 'McGraw Hill', category: 'Artificial Intelligence', description: 'A foundational guide to machine learning algorithms and models.', coverImage: 'https://images.unsplash.com/photo-1531482615713-2afd69097998?auto=format&fit=crop&w=400&q=80', publicationYear: 1997, language: 'English', pageCount: 420, previewLink: 'https://books.google.com/books?id=EoYBngEACAAJ' },
      { googleId: 'fallback-default-6', title: 'Cloud Computing', author: 'Thomas Erl', ISBN: '9780133387528', publisher: 'Pearson', category: 'Cloud Computing', description: 'A practical framework covering cloud concepts and architecture.', coverImage: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=400&q=80', publicationYear: 2013, language: 'English', pageCount: 580, previewLink: 'https://books.google.com/books?id=Z3pTvgAACAAJ' },
      { googleId: 'fallback-default-7', title: 'Structural Analysis', author: 'R. C. Hibbeler', ISBN: '9780134610672', publisher: 'Pearson', category: 'Civil Engineering', description: 'A structural engineering reference for analysis and design.', coverImage: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80', publicationYear: 2016, language: 'English', pageCount: 848, previewLink: 'https://books.google.com/books?id=CDt2zQEACAAJ' },
      { googleId: 'fallback-default-8', title: 'Thermodynamics', author: 'Yunus A. Çengel', ISBN: '9780073398174', publisher: 'McGraw Hill', category: 'Mechanical Engineering', description: 'A classic engineering resource on thermodynamics and energy transfer.', coverImage: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=400&q=80', publicationYear: 2014, language: 'English', pageCount: 996, previewLink: 'https://books.google.com/books?id=lsNhjgEACAAJ' },
    ],
  };

  const categoryMap = [
    { match: /(computer science|software|programming|data structures|operating system|architecture)/, key: 'computer' },
    { match: /(database|sql|mongodb|mysql|postgres|oracle)/, key: 'database' },
    { match: /(ai|machine learning|deep learning|artificial intelligence|neural)/, key: 'ai' },
    { match: /(network|protocol|tcp|ip|communication)/, key: 'networking' },
    { match: /(electronic|circuit|digital|signal|electrical|electronics)/, key: 'electronics' },
    { match: /(math|calculus|mathematics|statistic|discrete)/, key: 'mathematics' },
    { match: /(civil|structural|construction|geotech|survey)/, key: 'civil' },
    { match: /(mechanical|thermo|fluid|design|machining)/, key: 'mechanical' },
    { match: /(cyber|security|hacking|crypt|network security)/, key: 'cyber' },
    { match: /(cloud|aws|azure|devops|microservices)/, key: 'cloud' },
  ];

  const match = categoryMap.find(({ match: matcher }) => matcher.test(q));
  return (match ? bookGroups[match.key] : bookGroups.default).slice(0, 12);
};

// @desc    Search books from Google Books API using optional GOOGLE_BOOKS_API_KEY
// @route   GET /api/books/external/search
// @access  Public
export const searchExternalBooks = async (req, res) => {
  try {
    const { query, limit, startIndex } = req.query;
    if (!query) {
      return res.status(400).json({ success: false, message: 'Search query parameter is required' });
    }

    const fallbackBooks = buildFallbackBooks(query);

    const maxResults = Math.min(60, Math.max(10, Number(limit) || 60));
    const start = Math.max(0, Number(startIndex) || 0);
    const apiKey = process.env.GOOGLE_BOOKS_API_KEY || '';
    const searchQuery = String(query).trim();
    const googleUrl = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(searchQuery)}&maxResults=${maxResults}&startIndex=${start}&printType=books&langRestrict=en${apiKey ? `&key=${apiKey}` : ''}`;

    const fetchGoogleBooks = () => new Promise((resolve, reject) => {
      import('https').then(({ default: https }) => {
        https.get(googleUrl, (response) => {
          let rawData = '';
          response.on('data', (chunk) => { rawData += chunk; });
          response.on('end', () => {
            if (response.statusCode && response.statusCode >= 400) {
              try {
                const payload = JSON.parse(rawData || '{}');
                reject(new Error(payload.error?.message || `Google Books API request failed with status ${response.statusCode}`));
              } catch (e) {
                reject(new Error(`Google Books API request failed with status ${response.statusCode}`));
              }
              return;
            }

            try {
              resolve(JSON.parse(rawData || '{}'));
            } catch (e) {
              reject(new Error('Failed to parse Google Books API response'));
            }
          });
        }).on('error', reject);
      }).catch(reject);
    });

    let data;
    try {
      data = await fetchGoogleBooks();
    } catch (error) {
      return res.json({
        success: true,
        count: fallbackBooks.length,
        data: fallbackBooks,
        fallback: true,
        message: 'Google Books API is temporarily unavailable. Showing curated fallback results.',
      });
    }

    if (data.error || !data.items || data.items.length === 0) {
      return res.json({
        success: true,
        count: fallbackBooks.length,
        data: fallbackBooks,
        fallback: true,
        message: 'No live results were returned. Showing curated fallback results.',
      });
    }

    const books = data.items
      .filter((item) => item.volumeInfo?.title)
      .map((item) => {
        const info = item.volumeInfo || {};
        const isbn13 = info.industryIdentifiers?.find((id) => id.type === 'ISBN_13');
        const isbn10 = info.industryIdentifiers?.find((id) => id.type === 'ISBN_10');
        const isbnId = isbn13?.identifier || isbn10?.identifier || `GID-${item.id}`;

        return {
          googleId: item.id,
          title: info.title || 'Untitled Book',
          author: info.authors ? info.authors.join(', ') : 'Unknown Author',
          ISBN: isbnId,
          publisher: info.publisher || 'Academic Press',
          category: info.categories ? info.categories[0].split(' / ')[0] : 'General',
          description: info.description ? info.description.slice(0, 400) : 'No description available.',
          coverImage:
            info.imageLinks?.thumbnail?.replace('http:', 'https:') ||
            info.imageLinks?.smallThumbnail?.replace('http:', 'https:') ||
            'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=400&q=80',
          publicationYear: info.publishedDate
            ? parseInt(info.publishedDate.slice(0, 4), 10) || 2024
            : 2024,
          language: info.language === 'en' ? 'English' : (info.language || 'English'),
          pageCount: info.pageCount || 0,
          previewLink: info.previewLink || '',
        };
      })
      .slice(0, maxResults);

    return res.json({
      success: true,
      count: books.length,
      data: books,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: `Server error: ${error.message}` });
  }
};

